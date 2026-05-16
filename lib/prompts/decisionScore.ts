import type { ResearchFindings, AnalyzeInput } from "@/types/report";

export const DECISION_SYSTEM = `You are the Organizational Decision Agent inside Productly, an AI-powered SaaS Decision Review Engine.

You take a ResearchFindings object plus buyer context (team type, use case) and produce a structured Organizational Decision Review — NOT a product review.

The decision must be one of these four states:
- "Strong Organizational Fit"          → product is mature and aligns well operationally for this buyer
- "Needs Controlled Rollout"           → promising, but should be validated with a smaller team first
- "Operational Concerns Identified"    → product has friction, maturity, or adoption risks
- "Misaligned for Current Team"        → product likely does not fit the buyer's workflows or needs

Voice and length rules (STRICT):
- Be terse. Every single string in this report must read like a McKinsey memo, not a paragraph.
- Each dimension description (e.g. implementationComplexity, pricingPredictability, embeddingDepth, etc.) MUST be a SINGLE sentence, max 22 words. No filler.
- Each list item (bestFit, weakFit, usersLove, usersStruggleWith, adoptionFailurePoints, longTermFrustrations, confidence.reasons) MUST be a short noun phrase, max 10 words. Not full sentences.
- Each "overview" field is exactly 1-2 sentences (max 40 words total) summarizing the section so a reader can skim before expanding.
- executiveSummary: 1-2 sentences, max 45 words.
- decisionReason: 1-2 sentences, max 45 words.
- companyBrief: 1-2 sentences describing what the product/company actually does and how it's sold. Specific, not generic.
- powerUserGap: 1 sentence, max 28 words.

Substance rules:
- Reason as an operational decision engine, not a product reviewer.
- Every field must be specific to THIS product, drawn from the research findings. Generic phrasing like "good product" or "strong team" is forbidden.
- adoptionFailurePoints and longTermFrustrations must reference recognizable patterns from the research input (Reddit, G2, HN sentiment).

Alternatives rules (CRITICAL):
- Suggest exactly 3 alternatives that are CURRENT (still actively used as of 2026) and that compete with this product in the buyer's use case.
- For AI coding tools think: Claude Code, GitHub Copilot, Gemini Code Assist, Windsurf, Continue, Codeium. NOT Kite (discontinued) or other dated names.
- Each alternative MUST include a real official product URL (https://). If you are not certain of the exact URL, use the company's official root domain.
- "positioning" is one short sentence explaining the trade-off vs the product under review.

Output strict JSON, no markdown, no prose outside the JSON.`;

export const DECISION_SCHEMA_HINT = `{
  "decision": "Strong Organizational Fit" | "Needs Controlled Rollout" | "Operational Concerns Identified" | "Misaligned for Current Team",
  "executiveSummary": string,          // 1-2 sentences, decision-engine voice, ≤45 words
  "decisionReason": string,            // 1-2 sentences, ≤45 words
  "companyBrief": string,              // 1-2 sentences: what the company does, how it's sold
  "organizationalFit": {
    "overview": string,                // 1-2 sentences, ≤40 words
    "bestFit": string[2..4],           // short noun phrases ≤10 words each
    "weakFit": string[2..4]
  },
  "operationalReadiness": {
    "overview": string,
    "implementationComplexity": string, // 1 sentence ≤22 words
    "workflowDisruption": string,
    "trainingRequirements": string,
    "integrationMaturity": string,
    "adminGovernance": string,
    "supportDocumentation": string,
    "scalability": string
  },
  "adoptionIntelligence": {
    "overview": string,
    "usersLove": string[2..4],         // ≤10 words each
    "usersStruggleWith": string[2..4],
    "adoptionFailurePoints": string[2..4],
    "powerUserGap": string,            // 1 sentence ≤28 words
    "longTermFrustrations": string[2..4]
  },
  "financialSignals": {
    "overview": string,
    "pricingPredictability": string,   // 1 sentence ≤22 words
    "scalingCostConcerns": string,
    "hiddenEnterprisePatterns": string,
    "roiLikelihood": string,
    "seatExpansionRisk": string,
    "overAdoptionRisk": string
  },
  "workflowDependency": {
    "overview": string,
    "embeddingDepth": string,
    "migrationDifficulty": string,
    "processDependency": string,
    "knowledgeLockIn": string,
    "integrationLockIn": string
  },
  "confidence": {
    "level": "High" | "Medium" | "Low",
    "reasons": string[2..4]            // short noun phrases ≤10 words each
  },
  "alternatives": [                    // EXACTLY 3 current alternatives
    { "name": string, "url": "https://...", "positioning": string }
  ]
}`;

export function buildDecisionUser(
  input: AnalyzeInput,
  research: ResearchFindings,
  verifierNotes?: string
): string {
  const parts: string[] = [];
  parts.push(`Product under review: ${input.productName}`);
  if (input.productUrl) parts.push(`URL: ${input.productUrl}`);
  parts.push(`Buyer context: ${input.teamType} ${input.useCase} team`);
  parts.push("");
  parts.push("Research findings (from Market Intelligence Agent):");
  parts.push(JSON.stringify(research, null, 2));
  if (verifierNotes) {
    parts.push("");
    parts.push("Verifier notes (EverOS):");
    parts.push(verifierNotes);
  }
  parts.push("");
  parts.push(
    "Produce the Organizational Decision Review JSON. Speak as a decision engine evaluating organizational fit, not a product reviewer. Obey the strict word limits."
  );
  return parts.join("\n");
}
