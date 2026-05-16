import { readEnv } from "./env";

type SerpResult = { title: string; url: string; snippet?: string };

/**
 * Bright Data SERP API. Returns a small list of search results plus the raw
 * SERP HTML snippet for downstream extraction. Returns null if not configured.
 */
export async function brightDataSerp(query: string): Promise<SerpResult[] | null> {
  const key = readEnv("BRIGHTDATA_API_KEY");
  const zone = readEnv("BRIGHTDATA_SERP_ZONE") || "serp_api";
  if (!key) return null;

  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        zone,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1`,
        format: "raw",
      }),
    });
    if (!res.ok) {
      console.warn("[brightdata-serp] non-ok", res.status);
      return null;
    }
    const text = await res.text();
    return parseSerp(text);
  } catch (err) {
    console.warn("[brightdata-serp] error", err);
    return null;
  }
}

function parseSerp(text: string): SerpResult[] {
  try {
    const json = JSON.parse(text);
    const organic = json?.organic || json?.results || [];
    if (Array.isArray(organic)) {
      return organic.slice(0, 10).map((r: { title?: string; link?: string; url?: string; description?: string; snippet?: string }) => ({
        title: r.title || r.link || r.url || "",
        url: r.link || r.url || "",
        snippet: r.description || r.snippet,
      }));
    }
  } catch {
    // not JSON; bail
  }
  return [];
}

/**
 * Combines several targeted SERP queries (general + Reddit + G2 + Hacker News)
 * into a deduped list of candidate URLs. Each query is `brd_json=1` against
 * Google through the configured Bright Data SERP zone.
 */
export async function brightDataTargetedResearch(
  productName: string,
  productUrl?: string
): Promise<SerpResult[]> {
  const queries: string[] = [
    `${productName} pricing`,
    `${productName} docs site:${guessHost(productUrl) || ""}`.trim(),
    `${productName} review site:reddit.com`,
    `${productName} site:g2.com`,
    `${productName} site:news.ycombinator.com`,
    `${productName} alternatives`,
  ].filter((q) => q.length > 0 && !q.endsWith("site:"));

  const all: SerpResult[] = [];
  for (const q of queries) {
    const res = await brightDataSerp(q);
    if (res) all.push(...res);
  }
  // dedupe by url
  const seen = new Set<string>();
  const out: SerpResult[] = [];
  for (const r of all) {
    if (!r.url) continue;
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    out.push(r);
  }
  return out;
}

function guessHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Bright Data Web Unlocker. Fetches a URL through Bright Data's unlocker zone
 * so paywalls, geos, and bot-walls don't block research. Returns null if not
 * configured.
 */
export async function brightDataFetch(url: string): Promise<string | null> {
  const key = readEnv("BRIGHTDATA_API_KEY");
  const zone = readEnv("BRIGHTDATA_UNLOCKER_ZONE") || "web_unlocker";
  if (!key) return null;

  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        zone,
        url,
        format: "raw",
      }),
    });
    if (!res.ok) {
      console.warn("[brightdata-fetch] non-ok", res.status, url);
      return null;
    }
    const text = await res.text();
    return stripHtml(text).slice(0, 8000);
  } catch (err) {
    console.warn("[brightdata-fetch] error", err);
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
