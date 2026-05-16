import type {
  AnalyzeInput,
  ProductlyReport,
  ResearchFindings,
} from "@/types/report";
import { decisionSchema, type DecisionSchema } from "@/lib/schema";
import {
  DECISION_SCHEMA_HINT,
  DECISION_SYSTEM,
  buildDecisionUser,
} from "@/lib/prompts/decisionScore";
import { reason } from "@/lib/providers/qwen";
import { openaiJSON } from "@/lib/providers/openai";
import { mockReport } from "@/lib/mockReport";
import { detectProviders } from "@/lib/providers/env";
import type { Emitter } from "@/lib/stream";
import { resolveOfficialProductUrl } from "@/lib/alternativeUrls";

/**
 * Organizational Decision Agent.
 *
 * Transforms ResearchFindings + buyer context into a structured Organizational
 * Decision Review (NOT a product review). Returns one of:
 *   - "Strong Organizational Fit"
 *   - "Needs Controlled Rollout"
 *   - "Operational Concerns Identified"
 *   - "Misaligned for Current Team"
 */
export async function runOrganizationalDecisionAgent(
  input: AnalyzeInput,
  research: ResearchFindings,
  verifierNotes: string | undefined,
  emit: Emitter
): Promise<{
  report: ProductlyReport;
  reasoningProvider: "qwen" | "zai" | "openai" | "none";
}> {
  const cfg = detectProviders();

  emit.progress(
    80,
    `Organizational Decision Agent reasoning via ${
      cfg.reasoning === "none" ? "mock fallback" : cfg.reasoning
    }`,
    "reason"
  );

  let decision: DecisionSchema | null = null;
  let reasoningProvider: "qwen" | "zai" | "openai" | "none" = "none";

  const reasoned = await reason<DecisionSchema>({
    system: DECISION_SYSTEM,
    user: buildDecisionUser(input, research, verifierNotes),
    jsonOnly: true,
    schemaHint: DECISION_SCHEMA_HINT,
    temperature: 0.3,
  });

  if (reasoned) {
    const parsed = decisionSchema.safeParse(reasoned.data);
    if (parsed.success) {
      decision = parsed.data;
      reasoningProvider = reasoned.provider;
    }
  }

  if (!decision && cfg.openai && reasoningProvider !== "openai") {
    emit.progress(88, "Falling back to OpenAI for final synthesis", "synth");
    const synth = await openaiJSON<DecisionSchema>({
      system: DECISION_SYSTEM,
      user: buildDecisionUser(input, research, verifierNotes),
      schemaHint: DECISION_SCHEMA_HINT,
      temperature: 0.3,
    });
    if (synth) {
      const parsed = decisionSchema.safeParse(synth);
      if (parsed.success) {
        decision = parsed.data;
        reasoningProvider = "openai";
      }
    }
  }

  if (!decision) {
    emit.progress(95, "All reasoning paths unavailable — using mock fallback", "fallback");
    const fallback = mockReport(input);
    if (research.sources.length > 0) {
      fallback.sourceLinks = mergeUrl(fallback.sourceLinks, research.sources);
    }
    if (research.alternatives.length > 0) {
      fallback.alternatives = research.alternatives;
    }
    return { report: fallback, reasoningProvider: "none" };
  }

  emit.progress(98, `Decision: ${decision.decision}`, "decision-ready");

  const report: ProductlyReport = {
    productName: input.productName,
    productUrl: input.productUrl,
    teamType: input.teamType,
    useCase: input.useCase,

    companyBrief: decision.companyBrief,

    decision: decision.decision,
    executiveSummary: decision.executiveSummary,
    decisionReason: decision.decisionReason,

    organizationalFit: decision.organizationalFit,
    operationalReadiness: decision.operationalReadiness,
    adoptionIntelligence: decision.adoptionIntelligence,
    financialSignals: decision.financialSignals,
    workflowDependency: decision.workflowDependency,
    confidence: decision.confidence,

    alternatives: ensureLinkedAlternatives(
      decision.alternatives.length > 0 ? decision.alternatives : research.alternatives
    ),
    sourceLinks: research.sources,

    meta: {
      generatedAt: new Date().toISOString(),
      providers: {
        brightData: false,
        perplexity: false,
        openai: false,
        reasoning: reasoningProvider,
        everOS: false,
        agentField: false,
      },
      degraded: false,
    },
  };

  return { report, reasoningProvider };
}

/**
 * Every alternative row gets a working https URL: keep model URLs when they
 * look like real vendor links; otherwise resolve via catalog / search.
 */
function ensureLinkedAlternatives<
  T extends { name: string; url?: string; positioning: string }
>(items: T[]): T[] {
  return items.map((a) => ({
    ...a,
    url: resolveOfficialProductUrl(a.name, a.url),
  }));
}

function mergeUrl<T extends { url: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((x) => x.url));
  const out = [...a];
  for (const x of b) {
    if (!seen.has(x.url)) {
      out.push(x);
      seen.add(x.url);
    }
  }
  return out;
}
