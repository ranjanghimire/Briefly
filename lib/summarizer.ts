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

const NOISE_PHRASES = [
  "menu",
  "subscribe",
  "sign in",
  "home",
  "world",
  "sports",
  "business",
  "newsletter",
  "advertise"
];

function truncate(s: string, maxChars: number): string {
  const v = s ?? "";
  if (v.length <= maxChars) return v;
  return `${v.slice(0, maxChars).trimEnd()}…`;
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
}

function hasNoisePhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return NOISE_PHRASES.some((phrase) => lower.includes(phrase));
}

function looksTimestampOrByline(text: string): boolean {
  const lower = text.toLowerCase();
  if (
    /\b(updated|published|posted)\b/.test(lower) &&
    /\b(am|pm|utc|gmt|est|pst|cst)\b/.test(lower)
  ) {
    return true;
  }
  if (/^\s*by\s+[a-z]/i.test(text)) return true;
  if (/\b\d{1,2}:\d{2}\b/.test(text)) return true;
  return false;
}

function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeSentence(s: string): string {
  const collapsed = s.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  if (/[.!?]$/.test(collapsed)) return collapsed;
  return `${collapsed}.`;
}

function sanitizeSummaryText(text: string): string {
  const filtered = sentenceSplit(text).filter((s) => {
    if (!/[a-z]/i.test(s)) return false;
    if (hasNoisePhrase(s)) return false;
    if (looksTimestampOrByline(s)) return false;
    return true;
  });
  return filtered.map(normalizeSentence).join(" ").trim();
}

function ensureSentenceRange(text: string, min: number, max: number): string {
  const clean = sanitizeSummaryText(text);
  const sentences = sentenceSplit(clean);
  if (sentences.length === 0) return "";
  const picked = sentences.slice(0, max);
  return picked.map(normalizeSentence).join(" ").trim();
}

function cleanAndClipForPrompt(raw: string): string {
  const cleaned = cleanArticleText(raw);
  // Keep token usage bounded for chat completion calls.
  return truncate(cleaned, 16_000);
}

export function cleanArticleText(raw: string): string {
  if (!raw) return "";
  const withoutBlocks = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");

  const textOnly = withoutBlocks
    .replace(/<\/?(p|div|article|section|h[1-6]|li|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeBasicEntities(textOnly)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const lines = decoded
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/https?:\/\//i.test(line))
    .filter((line) => !looksTimestampOrByline(line))
    .filter((line) => !hasNoisePhrase(line))
    .filter((line) => {
      if (!/[a-z]/i.test(line)) return false;
      const shortNoisy = line.length < 30 && line.split(/\s+/).length <= 5;
      return !shortNoisy;
    });

  const paragraphText = lines.join("\n");
  const sentences = sentenceSplit(paragraphText)
    .map(normalizeSentence)
    .filter(Boolean)
    .filter((s) => s.length >= 35)
    .filter((s) => !hasNoisePhrase(s))
    .filter((s) => !looksTimestampOrByline(s));

  return sentences.join(" ").replace(/\s+/g, " ").trim();
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
  const corpus = cleanAndClipForPrompt(buildCorpusForSummary(article));
  const title = article.title?.trim() ?? "";
  const sourceSentences = sentenceSplit(corpus);

  const short_summary = sourceSentences.length
    ? ensureSentenceRange(sourceSentences.slice(0, 3).join(" "), 2, 3)
    : title || "Summary unavailable for this article.";

  const long_summary = sourceSentences.length
    ? ensureSentenceRange(sourceSentences.slice(0, 6).join(" "), 4, 6)
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
  const articleText = cleanAndClipForPrompt(buildCorpusForSummary(params.article));
  if (!articleText) {
    throw new Error("Article text empty after cleaning");
  }

  const prompt = `
SHORT SUMMARY PROMPT:
"Summarize the following news article in 2–3 crisp sentences. Focus only on the core event, facts, and outcome. Exclude all navigation text, menus, ads, timestamps, author bios, and unrelated site content. Write in clean, neutral, human language."

LONG SUMMARY PROMPT:
"Write a clear, human-readable summary of the following news article in 4–6 sentences. Focus on the key event, context, and implications. Exclude all navigation text, menus, ads, links, newsletter prompts, timestamps, and unrelated site content. Write in natural, concise language suitable for a news briefing."

Return ONLY a valid JSON object with exactly these keys:
- short_summary
- long_summary

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
    typeof parsed?.short_summary === "string"
      ? ensureSentenceRange(parsed.short_summary, 2, 3)
      : "";
  const long_summary =
    typeof parsed?.long_summary === "string"
      ? ensureSentenceRange(parsed.long_summary, 4, 6)
      : "";

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
