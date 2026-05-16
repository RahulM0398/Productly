export const RESEARCH_SYSTEM = `You are the Market Intelligence Agent inside Productly, an AI-powered SaaS Decision Review Engine.

Your job: take scraped product pages, search results, and community discussion (Reddit, G2, Hacker News, blogs, reviews) and reduce them to a single ResearchFindings JSON object that the Organizational Decision Agent will reason over.

Hard rules:
- Be conservative. Use signals from the input only — never invent pricing, features, or claims.
- If a signal is not present in the input, write "unclear" rather than guessing.
- Reddit, G2, and Hacker News fields must summarize what real users said in those exact sources. If a source produced no usable content, write "no usable signal found in this source".
- Prefer specific phrases users actually used over generic language.
- Output strict JSON, no markdown fences, no prose outside the JSON.`;

export const RESEARCH_SCHEMA_HINT = `{
  "productOverview": string,           // 1-2 sentences from the official site
  "companySignals": string,            // company stage, funding, team signals
  "pricingSignals": string,            // what the pricing page + reviews say
  "docsSignals": string,               // documentation depth + gaps
  "securitySignals": string,           // privacy, compliance, data-handling
  "redditFindings": string,            // 2-3 sentences from Reddit threads
  "g2Findings": string,                // 2-3 sentences from G2 reviews
  "hackerNewsFindings": string,        // 2-3 sentences from HN discussion
  "positiveThemes": string[],
  "negativeThemes": string[],
  "commonComplaints": string[],
  "alternatives": [{ "name": string, "url": string?, "positioning": string }],
  "sources": [{ "title": string, "url": string, "type": "website"|"pricing"|"docs"|"security"|"reddit"|"g2"|"hackernews"|"review"|"news"|"blog"|"alternative"|"other" }]
}`;

export function buildResearchUser(input: {
  productName: string;
  productUrl?: string;
  teamType: string;
  useCase: string;
  scraped: { source: string; text: string }[];
  perplexity?: { text: string; citations: { title: string; url: string }[] };
}) {
  const parts: string[] = [];
  parts.push(`Product under review: ${input.productName}`);
  if (input.productUrl) parts.push(`URL: ${input.productUrl}`);
  parts.push(`Buyer context: ${input.teamType} ${input.useCase} team`);
  parts.push("");

  if (input.scraped.length > 0) {
    parts.push("--- Scraped material (Bright Data Web Unlocker) ---");
    for (const s of input.scraped) {
      parts.push(`# ${s.source}`);
      parts.push(s.text.slice(0, 3000));
      parts.push("");
    }
  }
  if (input.perplexity) {
    parts.push("--- Web research (Perplexity, citation-grounded) ---");
    parts.push(input.perplexity.text);
    parts.push("");
    parts.push("Citations:");
    for (const c of input.perplexity.citations) {
      parts.push(`- ${c.title} :: ${c.url}`);
    }
  }
  parts.push("");
  parts.push(
    "Reduce the above to a ResearchFindings JSON. Populate redditFindings, g2Findings, and hackerNewsFindings strictly from the corresponding sources in the input. Include the most useful URLs in the sources array with accurate type tags."
  );
  return parts.join("\n");
}
