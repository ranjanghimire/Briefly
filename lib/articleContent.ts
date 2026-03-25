import axios from "axios";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\u0022")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
}

export function htmlToPlainText(html: string): string {
  const stripped = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");
  const text = stripped.replace(/<[^>]+>/g, " ");
  return decodeBasicEntities(text).replace(/\s+/g, " ").trim();
}

/**
 * Download article HTML (or plain text) and return cleaned body text for summarization.
 */
export async function fetchArticlePlainText(url: string): Promise<string | null> {
  try {
    const res = await axios.get<string>(url, {
      timeout: 15_000,
      maxRedirects: 5,
      responseType: "text",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.9"
      },
      maxContentLength: 2_000_000,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const body = typeof res.data === "string" ? res.data : "";
    if (!body.trim()) return null;

    const ct = String(res.headers["content-type"] ?? "").toLowerCase();
    const looksHtml =
      ct.includes("html") ||
      body.trimStart().toLowerCase().startsWith("<!") ||
      body.trimStart().toLowerCase().startsWith("<html");

    if (looksHtml) {
      return htmlToPlainText(body);
    }

    return body.replace(/\s+/g, " ").trim() || null;
  } catch {
    return null;
  }
}
