import { z } from "zod";

export const sourceLinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z
    .enum([
      "website",
      "pricing",
      "docs",
      "security",
      "reddit",
      "g2",
      "hackernews",
      "review",
      "news",
      "blog",
      "alternative",
      "other",
    ])
    .default("other"),
});

export const alternativeSchema = z.object({
  name: z.string(),
  url: z.string().url().optional().or(z.literal("")),
  positioning: z.string(),
});

export const researchFindingsSchema = z.object({
  productOverview: z.string(),
  companySignals: z.string(),
  pricingSignals: z.string(),
  docsSignals: z.string(),
  securitySignals: z.string(),
  redditFindings: z.string(),
  g2Findings: z.string(),
  hackerNewsFindings: z.string(),
  positiveThemes: z.array(z.string()).default([]),
  negativeThemes: z.array(z.string()).default([]),
  commonComplaints: z.array(z.string()).default([]),
  alternatives: z.array(alternativeSchema).default([]),
  sources: z.array(sourceLinkSchema).default([]),
});

export const decisionSchema = z.object({
  decision: z.enum([
    "Strong Organizational Fit",
    "Needs Controlled Rollout",
    "Operational Concerns Identified",
    "Misaligned for Current Team",
  ]),
  executiveSummary: z.string(),
  decisionReason: z.string(),
  companyBrief: z.string(),
  organizationalFit: z.object({
    overview: z.string(),
    bestFit: z.array(z.string()).min(2).max(5),
    weakFit: z.array(z.string()).min(2).max(5),
  }),
  operationalReadiness: z.object({
    overview: z.string(),
    implementationComplexity: z.string(),
    workflowDisruption: z.string(),
    trainingRequirements: z.string(),
    integrationMaturity: z.string(),
    adminGovernance: z.string(),
    supportDocumentation: z.string(),
    scalability: z.string(),
  }),
  adoptionIntelligence: z.object({
    overview: z.string(),
    usersLove: z.array(z.string()).min(2).max(5),
    usersStruggleWith: z.array(z.string()).min(2).max(5),
    adoptionFailurePoints: z.array(z.string()).min(2).max(5),
    powerUserGap: z.string(),
    longTermFrustrations: z.array(z.string()).min(2).max(5),
  }),
  financialSignals: z.object({
    overview: z.string(),
    pricingPredictability: z.string(),
    scalingCostConcerns: z.string(),
    hiddenEnterprisePatterns: z.string(),
    roiLikelihood: z.string(),
    seatExpansionRisk: z.string(),
    overAdoptionRisk: z.string(),
  }),
  workflowDependency: z.object({
    overview: z.string(),
    embeddingDepth: z.string(),
    migrationDifficulty: z.string(),
    processDependency: z.string(),
    knowledgeLockIn: z.string(),
    integrationLockIn: z.string(),
  }),
  confidence: z.object({
    level: z.enum(["High", "Medium", "Low"]),
    reasons: z.array(z.string()).min(2).max(5),
  }),
  alternatives: z.array(alternativeSchema).min(2).max(5),
});

export type ResearchFindingsSchema = z.infer<typeof researchFindingsSchema>;
export type DecisionSchema = z.infer<typeof decisionSchema>;
