import OpenAI from "openai";
import type { NormalizedArticle } from "./types";
import { getRequiredEnv, parseJsonEnv } from "./utils";

type AiModelKeys = {
  openai?: {
    apiKey: string;
    primaryModel?: string;
    fallbackModel?: string;
  };
};

function truncate(s: string, maxChars: number): string {
  const v = s ?? "";
  if (v.length <= maxChars) return v;
  return v.slice(0, maxChars).trimEnd();
}

function extractJsonObject(text: string): any | null {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function heuristicSummaries(article: NormalizedArticle) {
  const title = article.title?.trim() ?? "";
  const desc = article.description?.trim() ?? "";
  const source = article.source?.trim();

  const shortLine1 = title ? title : "News article";
  const shortLine2 = desc ? truncate(desc.replace(/\s+/g, " "), 160) : "Source details unavailable.";
  const short_summary = source
    ? `${shortLine1}\n(${source}) ${shortLine2}`
    : `${shortLine1}\n${shortLine2}`;

  const longBase = [
    title ? `Title: ${title}` : null,
    desc ? `Description: ${truncate(desc.replace(/\s+/g, " "), 450)}` : null,
    article.publishedAt ? `Published: ${article.publishedAt}` : null,
    source ? `Source: ${source}` : null
  ]
    .filter(Boolean)
    .join(" ");

  // Approximate 100-150 words using provided description (already factual).
  const long_summary = longBase
    ? `In brief: ${longBase}. This summary is based on the article text provided by the news source.`
    : "In brief: Summary unavailable due to missing article content.";

  return { short_summary, long_summary };
}

async function callOpenAiSummarizer(params: {
  model: string;
  article: NormalizedArticle;
  apiKey: string;
}) {
  const client = new OpenAI({ apiKey: params.apiKey });

  const title = params.article.title?.trim() ?? "";
  const desc = params.article.description?.trim() ?? "";
  const source = params.article.source?.trim() ?? "";

  const prompt = `
You generate factual, neutral summaries for a mobile news app.
Use only the information in the provided fields. Do not invent details.

Return ONLY a valid JSON object with exactly these keys:
- short_summary: 2-3 lines (plain text), no bullet points
- long_summary: 1 paragraph (~100-150 words), plain text

Article fields:
- title: ${title}
- description: ${truncate(desc.replace(/\s+/g, " "), 800)}
- source: ${source || "unknown"}
`.trim();

  const resp = await client.chat.completions.create({
    model: params.model,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
    // Enough tokens for ~100-150 words.
    max_tokens: 420
  });

  const content = resp.choices?.[0]?.message?.content ?? "";
  const parsed = extractJsonObject(content);
  if (!parsed?.short_summary || !parsed?.long_summary) {
    throw new Error("Model returned invalid summary JSON");
  }
  return {
    short_summary: String(parsed.short_summary),
    long_summary: String(parsed.long_summary)
  };
}

export async function summarizeArticle(params: { article: NormalizedArticle }) {
  const keys = parseJsonEnv<AiModelKeys>(
    getRequiredEnv("AI_MODEL_KEYS"),
    "AI_MODEL_KEYS"
  );
  const openai = keys.openai;
  const apiKey = openai?.apiKey;
  if (!apiKey) throw new Error("Missing AI_MODEL_KEYS.openai.apiKey");

  const primaryModel = openai?.primaryModel ?? "gpt-4o-mini";
  const fallbackModel = openai?.fallbackModel ?? "gpt-4o";

  try {
    return await callOpenAiSummarizer({
      model: primaryModel,
      article: params.article,
      apiKey
    });
  } catch (err) {
    // Fallback to a mid-tier model when the primary fails.
    try {
      return await callOpenAiSummarizer({
        model: fallbackModel,
        article: params.article,
        apiKey
      });
    } catch {
      // Final fallback keeps the pipeline functional even if AI is down.
      return heuristicSummaries(params.article);
    }
  }
}

