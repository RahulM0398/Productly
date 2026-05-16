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

  // ---- 1. Bright Data: targeted SERP + page fetches -------------------------
  if (cfg.brightData) {
    emit.progress(
      10,
      `Searching the open web for ${input.productName} across Reddit, G2, Hacker News, docs, and pricing`,
      "search"
    );
    const serp = await brightDataTargetedResearch(
      input.productName,
      input.productUrl
    );

    if (serp.length > 0) {
      emit.progress(
        18,
        `Found ${serp.length} candidate sources — selecting most authoritative`,
        "search"
      );

      const picked = selectUrls(serp, input.productUrl, input.productName);

      const total = picked.length;
      for (let i = 0; i < total; i++) {
        const url = picked[i];
        const pct = 18 + Math.round(((i + 1) / total) * 30);
        emit.progress(pct, `Extracting from ${shortUrl(url)}`, "extract");
        const text = await brightDataFetch(url);
        if (text && text.length > 200) {
          const type = inferType(url);
          scraped.push({ source: `${type}: ${shortUrl(url)}`, text });
          const link: SourceLink = { title: shortUrl(url), url, type };
          discoveredSources.push(link);
          emit.source(link);
        }
      }
    }
  }

  // ---- 2. Perplexity: grounded community + review research ------------------
  if (cfg.perplexity) {
    emit.progress(
      52,
      `Cross-referencing community sentiment via Perplexity`,
      "perplexity"
    );
  }

  const perplexity = cfg.perplexity
    ? await perplexitySearch({
        prompt: `Investigate "${input.productName}" (${input.productUrl ?? ""}) as a software adoption decision for a ${input.teamType} ${input.useCase} team.

Summarize what real users say across Reddit, Hacker News, G2, Capterra, and the product's own community channels. Focus on:
- recurring positive themes (be specific, quote phrasing where possible)
- recurring negative themes
- pricing reality at team scale vs published pricing
- onboarding and operational complexity
- workflow dependency and switching cost
- 2-3 credible alternatives with one-line positioning

Cite specific URLs. Prefer Reddit, G2, HN over generic listicles.`,
      })
    : null;

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
    if (r.url.includes("pricing") && picked.size < 5) picked.add(r.url);
    if (r.url.includes("/docs") && picked.size < 6) picked.add(r.url);
    if (r.url.includes("/security") && picked.size < 7) picked.add(r.url);

    for (const host of Object.keys(hostBuckets)) {
      if (r.url.includes(host) && hostBuckets[host] < 1) {
        picked.add(r.url);
        hostBuckets[host]++;
        break;
      }
    }
  }

  if (picked.size < 4) {
    for (const r of serp) {
      if (!r.url) continue;
      if (
        productName &&
        r.url.toLowerCase().includes(productName.toLowerCase().split(" ")[0])
      ) {
        picked.add(r.url);
      }
      if (picked.size >= 6) break;
    }
  }

  return Array.from(picked).slice(0, 6);
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
