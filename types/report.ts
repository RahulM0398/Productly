export type DecisionState =
  | "Strong Organizational Fit"
  | "Needs Controlled Rollout"
  | "Operational Concerns Identified"
  | "Misaligned for Current Team";

export type SourceLink = {
  title: string;
  url: string;
  type:
    | "website"
    | "pricing"
    | "docs"
    | "security"
    | "reddit"
    | "g2"
    | "hackernews"
    | "review"
    | "news"
    | "blog"
    | "alternative"
    | "other";
};

export type Alternative = {
  name: string;
  url?: string;
  positioning: string;
};

export type OrganizationalFit = {
  overview: string;
  bestFit: string[];
  weakFit: string[];
};

export type OperationalReadiness = {
  overview: string;
  implementationComplexity: string;
  workflowDisruption: string;
  trainingRequirements: string;
  integrationMaturity: string;
  adminGovernance: string;
  supportDocumentation: string;
  scalability: string;
};

export type AdoptionIntelligence = {
  overview: string;
  usersLove: string[];
  usersStruggleWith: string[];
  adoptionFailurePoints: string[];
  powerUserGap: string;
  longTermFrustrations: string[];
};

export type FinancialSignals = {
  overview: string;
  pricingPredictability: string;
  scalingCostConcerns: string;
  hiddenEnterprisePatterns: string;
  roiLikelihood: string;
  seatExpansionRisk: string;
  overAdoptionRisk: string;
};

export type WorkflowDependency = {
  overview: string;
  embeddingDepth: string;
  migrationDifficulty: string;
  processDependency: string;
  knowledgeLockIn: string;
  integrationLockIn: string;
};

export type DecisionConfidence = {
  level: "High" | "Medium" | "Low";
  reasons: string[];
};

export type ProductlyReport = {
  productName: string;
  productUrl?: string;
  teamType: string;
  useCase: string;

  companyBrief: string;

  decision: DecisionState;
  executiveSummary: string;
  decisionReason: string;

  organizationalFit: OrganizationalFit;
  operationalReadiness: OperationalReadiness;
  adoptionIntelligence: AdoptionIntelligence;
  financialSignals: FinancialSignals;
  workflowDependency: WorkflowDependency;
  confidence: DecisionConfidence;

  alternatives: Alternative[];
  sourceLinks: SourceLink[];

  meta: {
    generatedAt: string;
    providers: {
      brightData: boolean;
      perplexity: boolean;
      openai: boolean;
      reasoning: "qwen" | "zai" | "openai" | "none";
      everOS: boolean;
      agentField: boolean;
    };
    degraded: boolean;
  };
};

export type ResearchFindings = {
  productOverview: string;
  companySignals: string;
  pricingSignals: string;
  docsSignals: string;
  securitySignals: string;
  redditFindings: string;
  g2Findings: string;
  hackerNewsFindings: string;
  positiveThemes: string[];
  negativeThemes: string[];
  commonComplaints: string[];
  alternatives: Alternative[];
  sources: SourceLink[];
};

export type AnalyzeInput = {
  productName: string;
  productUrl?: string;
  teamType: string;
  useCase: string;
};

/**
 * Label maps for the dimension fields only — `overview` is rendered separately
 * as the section overview, so it is intentionally excluded from these maps.
 */
export type OperationalDimensionKey = Exclude<keyof OperationalReadiness, "overview">;
export type FinancialDimensionKey = Exclude<keyof FinancialSignals, "overview">;
export type WorkflowDimensionKey = Exclude<keyof WorkflowDependency, "overview">;

export const OPERATIONAL_LABELS = {
  implementationComplexity: "Implementation Complexity",
  workflowDisruption: "Workflow Disruption Risk",
  trainingRequirements: "Training Requirements",
  integrationMaturity: "Integration Maturity",
  adminGovernance: "Admin & Governance Readiness",
  supportDocumentation: "Support & Documentation Quality",
  scalability: "Scalability Signals",
} as const satisfies Record<OperationalDimensionKey, string>;

export const FINANCIAL_LABELS = {
  pricingPredictability: "Pricing Predictability",
  scalingCostConcerns: "Scaling Cost Concerns",
  hiddenEnterprisePatterns: "Hidden Enterprise Pricing Patterns",
  roiLikelihood: "ROI Likelihood",
  seatExpansionRisk: "Seat Expansion Risk",
  overAdoptionRisk: "Over-Adoption Risk",
} as const satisfies Record<FinancialDimensionKey, string>;

export const WORKFLOW_LABELS = {
  embeddingDepth: "Workflow Embedding Depth",
  migrationDifficulty: "Migration Difficulty",
  processDependency: "Process Dependency",
  knowledgeLockIn: "Knowledge Lock-in",
  integrationLockIn: "Integration Lock-in",
} as const satisfies Record<WorkflowDimensionKey, string>;

export type StreamEvent =
  | { event: "progress"; data: { pct: number; label: string; phase: string } }
  | { event: "source"; data: SourceLink }
  | { event: "final"; data: ProductlyReport }
  | { event: "error"; data: { message: string } };
