import type { AnalyzeInput, ResearchFindings, SourceLink } from "@/types/report";
import { researchFindingsSchema } from "@/lib/schema";
import { mockResearch } from "@/lib/mockReport";
import {
  brightDataFetch,
  brightDataTargetedResearch,
} from "@/lib/providers/brightData";
import { perplexitySearch } from "@/lib/providers/perplexity";
import { openaiJSON } from "@/lib/providers/openai";
import { everOSVerify } from "@/lib/providers/everOS";
import { detectProviders } from "@/lib/providers/env";
import {
  RESEARCH_SCHEMA_HINT,
  RESEARCH_SYSTEM,
  buildResearchUser,
} from "@/lib/prompts/researchExtract";
import type { Emitter } from "@/lib/stream";
import { mapLimit } from "@/lib/async";

/** Cap parallel Web Unlocker calls — Bright Data tolerates concurrency; avoids piling up 6+ minute tails. */
const FETCH_CONCURRENCY = 4;
/** Fewer pages = faster end-to-end; coverage stays broad via parallel SERP. */
const MAX_SCRAPE_URLS = 5;

export type ResearchResult = {
  findings: ResearchFindings;
  verifierNotes?: string;
};

/**
 * Market Intelligence Agent.
 *
 * Gathers operational signal from:
 *   - The product's own website + pricing + docs (via Bright Data Web Unlocker)
 *   - Reddit threads, G2 reviews, Hacker News discussions (via Bright Data SERP → Web Unlocker)
 *   - Perplexity (citation-grounded web research) where configured
 *   - OpenAI for structured extraction into a typed ResearchFindings
 *   - EverOS as an optional verifier sub-agent
 */
export async function runMarketIntelligenceAgent(
  input: AnalyzeInput,
  emit: Emitter
): Promise<ResearchResult> {
  const cfg = detectProviders();

  emit.progress(
    5,
    `Market Intelligence Agent dispatched for ${input.productName}`,
    "init"
  );

  const scraped: { source: string; text: string }[] = [];
  const discoveredSources: SourceLink[] = [];

  const perplexityPrompt = `Investigate "${input.productName}" (${input.productUrl ?? ""}) as a software adoption decision for a ${input.teamType} ${input.useCase} team.

Summarize what real users say across Reddit, Hacker News, G2, Capterra, and the product's own community channels. Focus on:
- recurring positive themes (be specific, quote phrasing where possible)
- recurring negative themes
- pricing reality at team scale vs published pricing
- onboarding and operational complexity
- workflow dependency and switching cost
- 2-3 credible alternatives with one-line positioning

Cite specific URLs. Prefer Reddit, G2, HN over generic listicles.`;

  // ---- 1. Bright Data SERP + Perplexity in parallel (biggest wall-clock win) -----
  if (cfg.brightData || cfg.perplexity) {
    emit.progress(
      10,
      cfg.brightData && cfg.perplexity
        ? `Running Google SERP + Perplexity in parallel for ${input.productName}`
        : cfg.brightData
          ? `Searching the open web for ${input.productName}`
          : `Cross-referencing community sentiment via Perplexity`,
      "search"
    );
  }

  const [serp, perplexity] = await Promise.all([
    cfg.brightData
      ? brightDataTargetedResearch(input.productName, input.productUrl)
      : Promise.resolve([]),
    cfg.perplexity
      ? perplexitySearch({ prompt: perplexityPrompt })
      : Promise.resolve(null),
  ]);

  if (perplexity) {
    for (const c of perplexity.citations.slice(0, 10)) {
      const link: SourceLink = {
        title: c.title || shortUrl(c.url),
        url: c.url,
        type: inferType(c.url),
      };
      if (!discoveredSources.find((d) => d.url === link.url)) {
        discoveredSources.push(link);
        emit.source(link);
      }
    }
  }

  // ---- 2. Web Unlocker: fetch selected URLs with bounded concurrency ------------
  if (cfg.brightData && serp.length > 0) {
    emit.progress(
      28,
      `Found ${serp.length} SERP candidates — extracting up to ${MAX_SCRAPE_URLS} pages`,
      "search"
    );

    const picked = selectUrls(serp, input.productUrl, input.productName);
    let done = 0;

    await mapLimit(picked, FETCH_CONCURRENCY, async (url) => {
      const text = await brightDataFetch(url);
      done++;
      const denom = Math.max(picked.length, 1);
      emit.progress(
        28 + Math.round((done / denom) * 28),
        `Extracted ${done}/${picked.length}: ${shortUrl(url)}`,
        "extract"
      );
      if (text && text.length > 200) {
        const type = inferType(url);
        scraped.push({ source: `${type}: ${shortUrl(url)}`, text });
        const link: SourceLink = { title: shortUrl(url), url, type };
        discoveredSources.push(link);
        emit.source(link);
      }
    });
  }

  // ---- 3. OpenAI: structured extraction into ResearchFindings ---------------
  emit.progress(
    62,
    "OpenAI reducing scraped content into structured findings",
    "extract"
  );

  let findings: ResearchFindings | null = null;
  if (cfg.openai && (scraped.length > 0 || perplexity)) {
    const extracted = await openaiJSON<ResearchFindings>({
      system: RESEARCH_SYSTEM,
      user: buildResearchUser({
        productName: input.productName,
        productUrl: input.productUrl,
        teamType: input.teamType,
        useCase: input.useCase,
        scraped,
        perplexity: perplexity || undefined,
      }),
      schemaHint: RESEARCH_SCHEMA_HINT,
    });
    if (extracted) {
      const parsed = researchFindingsSchema.safeParse(extracted);
      if (parsed.success) findings = parsed.data;
    }
  }

  if (!findings) {
    findings = mockResearch(input);
  }

  if (discoveredSources.length > 0) {
    const seen = new Set(findings.sources.map((s) => s.url));
    for (const s of discoveredSources) {
      if (!seen.has(s.url)) {
        findings.sources.push(s);
        seen.add(s.url);
      }
    }
  }

  // ---- 4. EverOS: verifier sub-agent ----------------------------------------
  emit.progress(72, "Verifier sub-agent reviewing alternatives", "verify");
  const verified = cfg.everOS
    ? await everOSVerify({
        productName: input.productName,
        productUrl: input.productUrl,
        useCase: input.useCase,
        researchSummary: condenseFindings(findings),
      })
    : null;

  if (verified && verified.alternatives.length > 0) {
    findings.alternatives = mergeAlternatives(
      findings.alternatives,
      verified.alternatives
    );
  }

  emit.progress(75, "Market intelligence complete", "intel-done");
  return { findings, verifierNotes: verified?.verifierNotes };
}

function selectUrls(
  serp: { url: string }[],
  productUrl: string | undefined,
  productName: string
): string[] {
  const picked = new Set<string>();
  if (productUrl) picked.add(productUrl);

  const hostBuckets: Record<string, number> = {
    "reddit.com": 0,
    "g2.com": 0,
    "news.ycombinator.com": 0,
    "ycombinator.com": 0,
  };

  for (const r of serp) {
    if (!r.url) continue;
    if (picked.size >= MAX_SCRAPE_URLS) break;
    if (r.url.includes("pricing")) picked.add(r.url);
    if (picked.size >= MAX_SCRAPE_URLS) break;
    if (r.url.includes("/docs")) picked.add(r.url);
    if (picked.size >= MAX_SCRAPE_URLS) break;
    if (r.url.includes("/security")) picked.add(r.url);

    for (const host of Object.keys(hostBuckets)) {
      if (picked.size >= MAX_SCRAPE_URLS) break;
      if (r.url.includes(host) && hostBuckets[host] < 1) {
        picked.add(r.url);
        hostBuckets[host]++;
        break;
      }
    }
  }

  if (picked.size < 4) {
    for (const r of serp) {
      if (picked.size >= MAX_SCRAPE_URLS) break;
      if (!r.url) continue;
      if (
        productName &&
        r.url.toLowerCase().includes(productName.toLowerCase().split(" ")[0])
      ) {
        picked.add(r.url);
      }
    }
  }

  return Array.from(picked).slice(0, MAX_SCRAPE_URLS);
}

function inferType(url: string): SourceLink["type"] {
  const u = url.toLowerCase();
  if (u.includes("pricing")) return "pricing";
  if (u.includes("docs.") || u.includes("/docs") || u.includes("documentation")) return "docs";
  if (u.includes("security") || u.includes("trust")) return "security";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("g2.com")) return "g2";
  if (u.includes("news.ycombinator") || u.includes("hn.algolia") || u.includes("ycombinator")) return "hackernews";
  if (u.includes("capterra")) return "review";
  if (u.includes("medium.com") || u.includes("substack") || u.includes("/blog")) return "blog";
  return "website";
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function condenseFindings(f: ResearchFindings): string {
  return [
    `Overview: ${f.productOverview}`,
    `Company: ${f.companySignals}`,
    `Pricing: ${f.pricingSignals}`,
    `Docs: ${f.docsSignals}`,
    `Security: ${f.securitySignals}`,
    `Reddit: ${f.redditFindings}`,
    `G2: ${f.g2Findings}`,
    `Hacker News: ${f.hackerNewsFindings}`,
    `Positives: ${f.positiveThemes.join("; ")}`,
    `Negatives: ${f.negativeThemes.join("; ")}`,
    `Complaints: ${f.commonComplaints.join("; ")}`,
  ].join("\n");
}

function mergeAlternatives<T extends { name: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((x) => x.name.toLowerCase()));
  const out = [...a];
  for (const x of b) {
    if (!seen.has(x.name.toLowerCase())) {
      out.push(x);
      seen.add(x.name.toLowerCase());
    }
  }
  return out.slice(0, 4);
}
