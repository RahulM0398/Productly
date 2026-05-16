/**
 * Resolves a stable official URL for comparative products when the model omits
 * a link, returns a search URL, or returns a junk URL. Keeps the Alternative
 * Solutions ribbon usable on every deploy.
 */

const GENERIC_SEARCH_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "bing.com",
  "www.bing.com",
  "duckduckgo.com",
  "www.duckduckgo.com",
]);

/**
 * Flat (phrase → url) pairs. **Longest keys first** — first match wins so
 * "gemini code assist" beats "gemini".
 */
const KEY_TO_URL: { key: string; url: string }[] = [
  { key: "gemini antigravity", url: "https://gemini.google.com" },
  { key: "gemini code assist", url: "https://cloud.google.com/products/gemini/code-assist" },
  { key: "google code assist", url: "https://cloud.google.com/products/gemini/code-assist" },
  { key: "anthropic claude code", url: "https://www.anthropic.com/claude-code" },
  { key: "claude code", url: "https://www.anthropic.com/claude-code" },
  { key: "github copilot", url: "https://github.com/features/copilot" },
  { key: "microsoft copilot", url: "https://github.com/features/copilot" },
  { key: "sourcegraph cody", url: "https://sourcegraph.com/cody" },
  { key: "jetbrains ai assistant", url: "https://www.jetbrains.com/ai/" },
  { key: "continue extension", url: "https://www.continue.dev" },
  { key: "replit ghostwriter", url: "https://replit.com" },
  { key: "amazon q developer", url: "https://aws.amazon.com/q/developer/" },
  { key: "codeium windsurf", url: "https://windsurf.com" },
  { key: "windsurf ide", url: "https://windsurf.com" },
  { key: "cursor editor", url: "https://cursor.com" },
  { key: "cursor ide", url: "https://cursor.com" },
  { key: "notion ai", url: "https://www.notion.so" },
  { key: "google gemini", url: "https://gemini.google.com" },
  { key: "continue.dev", url: "https://www.continue.dev" },
  { key: "codewhisperer", url: "https://aws.amazon.com/q/developer/" },
  { key: "duet ai", url: "https://cloud.google.com/products/gemini/code-assist" },
  { key: "jetbrains ai", url: "https://www.jetbrains.com/ai/" },
  { key: "intellij ai", url: "https://www.jetbrains.com/ai/" },
  { key: "zed editor", url: "https://zed.dev" },
  { key: "amazon q", url: "https://aws.amazon.com/q/developer/" },
  { key: "aws q", url: "https://aws.amazon.com/q/developer/" },
  { key: "windsurf", url: "https://windsurf.com" },
  { key: "continue", url: "https://www.continue.dev" },
  { key: "codeium", url: "https://codeium.com" },
  { key: "tabnine", url: "https://www.tabnine.com" },
  { key: "cursor", url: "https://cursor.com" },
  { key: "copilot", url: "https://github.com/features/copilot" },
  { key: "cody", url: "https://sourcegraph.com/cody" },
  { key: "replit", url: "https://replit.com" },
  { key: "notion", url: "https://www.notion.so" },
  { key: "linear", url: "https://linear.app" },
  { key: "slack", url: "https://slack.com" },
  { key: "gong", url: "https://www.gong.io" },
  { key: "gemini", url: "https://gemini.google.com" },
  { key: "claude", url: "https://www.anthropic.com/claude-code" },
  { key: "zed", url: "https://zed.dev" },
].sort((a, b) => b.key.length - a.key.length);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/[,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsableHttpUrl(raw: string | undefined): boolean {
  if (!raw || !raw.trim()) return false;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.replace(/^www\./, "");
  if (
    GENERIC_SEARCH_HOSTS.has(u.hostname) ||
    GENERIC_SEARCH_HOSTS.has(host)
  ) {
    if (u.pathname === "/search" || u.pathname.startsWith("/search?")) {
      return false;
    }
  }
  return true;
}

function catalogLookup(normalized: string): string | null {
  for (const { key, url } of KEY_TO_URL) {
    if (normalized === key) return url;
    if (normalized.includes(key)) return url;
  }
  return null;
}

/**
 * Prefer the model's URL when it looks like a real vendor link; otherwise map
 * known product names to official pages; last resort is a Google search for the
 * product name + "official".
 */
export function resolveOfficialProductUrl(
  productName: string,
  candidateUrl?: string
): string {
  const cleaned = candidateUrl?.trim();
  if (cleaned && isUsableHttpUrl(cleaned)) {
    const u = new URL(cleaned);
    if (u.protocol === "http:") u.protocol = "https:";
    return u.toString();
  }

  const normalized = normalizeName(productName);
  const fromCatalog = catalogLookup(normalized);
  if (fromCatalog) return fromCatalog;

  return `https://www.google.com/search?q=${encodeURIComponent(`${productName.trim()} official site`)}`;
}
