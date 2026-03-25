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
  return `${v.slice(0, maxChars).trimEnd()}…`;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```/m.exec(t);
  if (fenced?.[1]) t = fenced[1].trim();

  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const candidate = t.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function buildCorpusForSummary(article: NormalizedArticle): string {
  const raw = article.rawContent?.trim();
  if (raw && raw.length >= 80) return raw;
  const title = article.title?.trim() ?? "";
  const desc = article.description?.trim() ?? "";
  return [title, desc].filter(Boolean).join("\n\n").trim();
}

function heuristicSummaries(article: NormalizedArticle) {
  const corpus = buildCorpusForSummary(article).replace(/\s+/g, " ").trim();
  const title = article.title?.trim() ?? "";

  const short_summary = corpus
    ? truncate(corpus, 360)
    : title || "Summary unavailable for this article.";

  const long_summary = corpus
    ? truncate(corpus, 1800)
    : "Summary unavailable — we could not retrieve enough text to summarize.";

  return { short_summary, long_summary };
}

async function callOpenAiSummarizer(params: {
  model: string;
  article: NormalizedArticle;
  apiKey: string;
}) {
  const client = new OpenAI({ apiKey: params.apiKey });

  const headline = params.article.title?.trim() ?? "";
  const articleText = truncate(buildCorpusForSummary(params.article), 14_000);

  const prompt = `
You are a professional news editor. Read the article below and write copy for a mobile news app.

Requirements:
- Use only facts stated in the article. Do not invent details or speculate.
- Neutral, factual tone.
- short_summary must be a concise, 2–3 sentence summary in plain English, focusing only on the core facts and what happened. No fluff, no clickbait, no markdown.
- long_summary must be 2 short paragraphs (about 120–180 words total) for a detail screen—more context, still factual, no bullet lists.

Return ONLY a JSON object with exactly these keys: "short_summary", "long_summary" (both strings).

Headline from the publisher: ${headline || "(none)"}

Article text:
${articleText}
`.trim();

  const resp = await client.chat.completions.create({
    model: params.model,
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
    max_tokens: 720
  });

  const content = resp.choices?.[0]?.message?.content ?? "";
  const parsed =
    (() => {
      try {
        return JSON.parse(content) as Record<string, unknown>;
      } catch {
        return extractJsonObject(content);
      }
    })();

  const short_summary =
    typeof parsed?.short_summary === "string" ? parsed.short_summary.trim() : "";
  const long_summary =
    typeof parsed?.long_summary === "string" ? parsed.long_summary.trim() : "";

  if (!short_summary || !long_summary) {
    throw new Error("Model returned invalid summary JSON");
  }

  return { short_summary, long_summary };
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
  } catch {
    try {
      return await callOpenAiSummarizer({
        model: fallbackModel,
        article: params.article,
        apiKey
      });
    } catch {
      return heuristicSummaries(params.article);
    }
  }
}
