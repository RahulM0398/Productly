import type { AnalyzeInput, ProductlyReport, ResearchFindings } from "@/types/report";
import { resolveOfficialProductUrl } from "@/lib/alternativeUrls";
import { mergeAlternativesForReport } from "@/lib/competitorSuggestions";

export function mockResearch(input: AnalyzeInput): ResearchFindings {
  const name = input.productName || "the product";
  return {
    productOverview: `${name} is positioned as a productivity tool for ${input.useCase} teams.`,
    companySignals: `${name} appears to be a venture-backed product company with a public team page and active hiring across engineering and go-to-market roles.`,
    pricingSignals:
      "Per-seat pricing with a free tier and a higher-priced team plan; enterprise pricing is gated behind sales contact.",
    docsSignals:
      "Documentation covers setup and core features but admin, governance, and migration paths are sparser.",
    securitySignals:
      "Encryption at rest and in transit is mentioned. SOC 2 and data-residency claims should be verified directly with the vendor.",
    redditFindings:
      "Reddit threads in r/ChatGPT and r/productivity highlight strong individual productivity wins, but recurring concerns around per-seat pricing at team scale.",
    g2Findings:
      "G2 reviews are mostly positive but flag onboarding friction for non-technical users and slow enterprise-control maturation.",
    hackerNewsFindings:
      "Hacker News discussions praise the core experience while questioning long-term pricing and workflow lock-in.",
    positiveThemes: [
      "Visible productivity uplift within a single session",
      "AI features feel meaningfully ahead of the prior tooling generation",
    ],
    negativeThemes: [
      "Per-seat pricing scales faster than headcount at team rollout",
      "Admin and audit controls lag the consumer-grade core",
    ],
    commonComplaints: [
      "Cost surprises at team scale",
      "Onboarding non-technical users",
      "Edge-case reliability during peak load",
    ],
    alternatives: mergeAlternativesForReport(input, [], []).slice(0, 2).map((a) => ({
      name: a.name,
      positioning: a.positioning,
      url: resolveOfficialProductUrl(a.name, a.url),
    })),
    sources: [
      { title: `${name} — Website`, url: input.productUrl || "https://example.com", type: "website" },
    ],
  };
}

export function mockReport(input: AnalyzeInput): ProductlyReport {
  const name = input.productName || "the product";
  return {
    productName: name,
    productUrl: input.productUrl,
    teamType: input.teamType,
    useCase: input.useCase,

    companyBrief: `${name} is a SaaS product that helps ${input.useCase.toLowerCase()} teams work faster with AI-assisted workflows. Sold per-seat with a free tier and a higher-priced team plan, with enterprise pricing gated behind sales.`,

    decision: "Needs Controlled Rollout",
    executiveSummary: `${name} shows real productivity upside for ${input.useCase} teams, but Productly identified workflow dependency risk and unclear enterprise governance maturity.`,
    decisionReason:
      "Strong for smaller teams chasing velocity; operational controls, pricing predictability, and dependency risk should be validated before company-wide adoption.",

    organizationalFit: {
      overview: `${name} fits fast-moving teams that can absorb workflow change quickly. It fits poorly in regulated or procurement-heavy contexts where predictability and governance outweigh velocity.`,
      bestFit: [
        `${input.teamType} ${input.useCase} teams with strong individual ownership culture`,
        "Fast-moving product organizations with willingness to iterate on tooling",
        "AI-native teams comfortable shifting workflow defaults",
      ],
      weakFit: [
        "Highly regulated environments with strict data-residency requirements",
        "Large non-technical organizations needing white-glove rollout",
        "Procurement-heavy enterprises requiring complete pricing predictability",
      ],
    },

    operationalReadiness: {
      overview: `Individually easy to adopt; team rollout exposes governance and integration gaps. Expect material workflow disruption — it is the source of both the upside and the lock-in risk.`,
      implementationComplexity: "Low for individuals; moderate at team scale with SSO and provisioning.",
      workflowDisruption: "Material — power users restructure workflows within days.",
      trainingRequirements: "Minimal for technical users; explicit playbook needed for non-technical teammates.",
      integrationMaturity: "Core integrations stable; enterprise/long-tail integrations uneven.",
      adminGovernance: "Basic admin present; audit and role granularity lag the consumer core.",
      supportDocumentation: "Happy-path docs are strong; advanced/migration scenarios are thin.",
      scalability: "Scales technically; the harder scaling question is cost and adoption uniformity.",
    },

    adoptionIntelligence: {
      overview: `Power users adopt quickly; the median teammate plateaus without an explicit playbook. Long-term frustration centres on cost surprise and uneven team practice.`,
      usersLove: [
        "Speed of the core workflow loop",
        "Quality of AI assistance compared to prior-generation tools",
        "Low friction to demonstrate value to a teammate",
      ],
      usersStruggleWith: [
        "Estimating real monthly cost under usage-based components",
        "Bringing non-technical teammates to parity with power users",
        "Disabling or constraining specific behaviors for compliance",
      ],
      adoptionFailurePoints: [
        "Rollout stalls when champions move to other projects",
        "Cost surprises freeze expansion mid-rollout",
        "Lack of consistent guardrails creates uneven team practices",
      ],
      powerUserGap:
        "Power users adopt deeply within a week; the median teammate plateaus after surface-level use unless an explicit playbook is provided.",
      longTermFrustrations: [
        "Workflow becomes dependent on the product faster than buyers expect",
        "Procurement friction grows once usage is normalized across the org",
        "Migration plans are rarely documented before the dependency is built",
      ],
    },

    financialSignals: {
      overview: `Pricing is predictable at the individual tier and unpredictable at team scale. The success case (rapid adoption) is also the cost case.`,
      pricingPredictability: "Predictable per-seat; usage-based components reduce predictability at scale.",
      scalingCostConcerns: "Cost grows faster than headcount when adoption succeeds.",
      hiddenEnterprisePatterns: "Enterprise pricing is opaque; expect negotiated floors and overage rates.",
      roiLikelihood: "High when productivity is measurable; lower without an internal metric.",
      seatExpansionRisk: "Expansion is organic and fast — good for vendor, hard for budgeting.",
      overAdoptionRisk: "Real — teams expand usage before pricing impact is fully understood.",
    },

    workflowDependency: {
      overview: `Embeds deeply into daily workflow. Data is easy to export; reproducing the workflow elsewhere is the actual switching cost.`,
      embeddingDepth: "Embeds into daily workflow: keybindings, AI assistance, and review converge in-product.",
      migrationDifficulty: "Export is easy; reproducing the workflow elsewhere is the hard part.",
      processDependency: "Team review, prompting, and handoff are rebuilt around the product's defaults.",
      knowledgeLockIn: "Institutional knowledge accumulates as prompts and conventions inside the product.",
      integrationLockIn: "Moderate — third-party integrations replaceable; workflow re-design cost is the real lock-in.",
    },

    confidence: {
      level: "Medium",
      reasons: [
        "Public sentiment is consistent across multiple sources",
        "Enterprise operational transparency is limited",
        "Long-term governance maturity is not yet observable from public signals",
      ],
    },

    alternatives: mergeAlternativesForReport(input, [], []).map((a) => ({
      name: a.name,
      positioning: a.positioning,
      url: resolveOfficialProductUrl(a.name, a.url),
    })),

    sourceLinks: [
      { title: `${name} — Website`, url: input.productUrl || "https://example.com", type: "website" },
      {
        title: `${name} on Reddit`,
        url: `https://www.google.com/search?q=${encodeURIComponent(name + " site:reddit.com")}`,
        type: "reddit",
      },
      {
        title: `${name} on G2`,
        url: `https://www.google.com/search?q=${encodeURIComponent(name + " site:g2.com")}`,
        type: "g2",
      },
      {
        title: `${name} on Hacker News`,
        url: `https://hn.algolia.com/?q=${encodeURIComponent(name)}`,
        type: "hackernews",
      },
    ],

    meta: {
      generatedAt: new Date().toISOString(),
      providers: {
        brightData: false,
        perplexity: false,
        openai: false,
        reasoning: "none",
        everOS: false,
        agentField: false,
      },
      degraded: true,
      researchMock: true,
      reasoningMock: true,
    },
  };
}
