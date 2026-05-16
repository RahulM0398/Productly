import type { AnalyzeInput, Alternative } from "@/types/report";

export type CompetitorHint = { name: string; positioning: string };

/** Labels that are never acceptable as product names in the report. */
const PLACEHOLDER_SUBSTRINGS = [
  "established incumbent",
  "open-source equivalent",
  "open source equivalent",
  "adjacent workflow",
  "legacy platform",
  "vendor-agnostic",
  "vendor agnostic",
  "competitor a",
  "competitor b",
  "option a",
  "option b",
  "tbd",
  "n/a",
];

const PLACEHOLDER_EXACT = new Set(
  [
    "Established Incumbent",
    "Open-source Equivalent",
    "Open Source Equivalent",
    "Adjacent Workflow Tool",
    "Legacy Vendor",
    "Competitor",
    "Alternative A",
    "Alternative B",
  ].map((s) => s.toLowerCase())
);

export function isPlaceholderAlternativeName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  if (PLACEHOLDER_EXACT.has(lower)) return true;
  for (const s of PLACEHOLDER_SUBSTRINGS) {
    if (lower.includes(s)) return true;
  }
  if (/^(the\s+)?(incumbent|legacy|generic|alternative)\b/i.test(t)) return true;
  return false;
}

function normalizeProduct(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** True if candidate is the same product as the subject (e.g. reviewing "Cursor" vs alt "Cursor"). */
function isSameProductAsSubject(subject: string, candidateName: string): boolean {
  const a = normalizeProduct(subject);
  const b = normalizeProduct(candidateName);
  if (a === b) return true;
  if (a.length >= 4 && (b === a || b.startsWith(a + " ") || a.startsWith(b + " "))) return true;
  return false;
}

/**
 * Last-resort **named** competitors when research + LLM did not yield three
 * real products. Always returns real product names — never role-based placeholders.
 */
export function suggestCompetitorsForSubject(input: AnalyzeInput): CompetitorHint[] {
  const pn = normalizeProduct(input.productName || "");
  const uc = (input.useCase || "").toLowerCase();

  type Pool = CompetitorHint[];

  const aiDev: Pool = [
    {
      name: "GitHub Copilot",
      positioning: `IDE/GitHub-native pair-programming; compare policy, egress, and seat economics vs ${input.productName}.`,
    },
    {
      name: "Windsurf",
      positioning: `AI-native IDE stack; stress-test governance and total cost vs ${input.productName}.`,
    },
    {
      name: "Claude Code",
      positioning: `Agent/terminal-centric workflow; evaluate team skill fit and controls vs ${input.productName}.`,
    },
  ];

  const docsWiki: Pool = [
    {
      name: "Notion",
      positioning: `All-in-one docs + wiki motion; compare permission model and API depth vs ${input.productName}.`,
    },
    {
      name: "Confluence",
      positioning: `Enterprise wiki standard; heavier IT footprint but deep enterprise controls vs ${input.productName}.`,
    },
    {
      name: "Coda",
      positioning: `Doc-first with structured data; evaluate complexity trade-offs vs ${input.productName}.`,
    },
  ];

  const pmEng: Pool = [
    {
      name: "Linear",
      positioning: `Issue tracking tuned for product/engineering velocity; compare integrations vs ${input.productName}.`,
    },
    {
      name: "Jira",
      positioning: `Enterprise-grade workflows; typically heavier admin load vs ${input.productName}.`,
    },
    {
      name: "Shortcut",
      positioning: `Mid-market PM tool; compare rollout friction and pricing predictability vs ${input.productName}.`,
    },
  ];

  const salesIntel: Pool = [
    {
      name: "Gong",
      positioning: `Revenue intelligence + conversation analytics; benchmark capture and compliance vs ${input.productName}.`,
    },
    {
      name: "Chorus",
      positioning: `Conversation intelligence alternative; compare CRM coverage and admin overhead vs ${input.productName}.`,
    },
    {
      name: "Salesloft",
      positioning: `Engagement + forecasting adjacent; evaluate stack overlap vs ${input.productName}.`,
    },
  ];

  const chatCollab: Pool = [
    {
      name: "Slack",
      positioning: `Team messaging hub; different surface area but often competes for attention budget vs ${input.productName}.`,
    },
    {
      name: "Microsoft Teams",
      positioning: `Bundled collaboration; procurement and identity story often stronger in Microsoft shops vs ${input.productName}.`,
    },
    {
      name: "Discord",
      positioning: `Community/high-velocity chat; weaker enterprise controls unless hardened vs ${input.productName}.`,
    },
  ];

  let pool: Pool;

  if (
    /cursor|windsurf|zed|codeium|tabnine|jetbrains|sublime|vim|copilot|claude code|replit|github|gitlab|android studio|xcode/.test(
      pn
    ) ||
    (uc.includes("engineer") &&
      /code|dev|ide|git|deploy|build|software|ai/.test(pn))
  ) {
    pool = aiDev;
  } else if (/notion|coda|obsidian|roam|confluence|slab|gitbook/.test(pn)) {
    pool = docsWiki;
  } else if (
    /linear|asana|shortcut|jira|monday|clickup|height|shortcut/.test(pn)
  ) {
    pool = pmEng;
  } else if (/gong|chorus|outreach|salesloft|clari|people\.ai/.test(pn)) {
    pool = salesIntel;
  } else if (/slack|teams|discord|mattermost|zoom|webex/.test(pn)) {
    pool = chatCollab;
  } else if (uc.includes("engineer") || uc.includes("product")) {
    pool = aiDev;
  } else if (uc.includes("operation") || uc.includes("marketing")) {
    pool = docsWiki;
  } else if (uc.includes("sales")) {
    pool = salesIntel;
  } else {
    pool = pmEng;
  }

  const subject = input.productName || "this product";
  return pool
    .filter((row) => !isSameProductAsSubject(subject, row.name))
    .slice(0, 3);
}

type Alt = { name: string; url?: string; positioning: string };

/**
 * Merge evidence-backed research alternatives + model output, drop placeholders,
 * exclude the subject product, then pad to three **named** competitors for this category.
 */
export function mergeAlternativesForReport(
  input: AnalyzeInput,
  researchAlts: Alternative[],
  decisionAlts: Alt[]
): Alt[] {
  const subject = input.productName || "";
  const merged: Alt[] = [];
  const seen = new Set<string>();

  const push = (a: Alt | undefined | null) => {
    if (!a?.name?.trim()) return;
    const key = a.name.trim().toLowerCase();
    if (seen.has(key)) return;
    if (isPlaceholderAlternativeName(a.name)) return;
    if (isSameProductAsSubject(subject, a.name)) return;
    seen.add(key);
    merged.push({
      name: a.name.trim(),
      url: a.url?.trim() || undefined,
      positioning: a.positioning?.trim() || "Named competitor in the same evaluation set.",
    });
  };

  for (const a of researchAlts || []) push(a);
  for (const a of decisionAlts || []) push(a);

  if (merged.length < 3) {
    for (const p of suggestCompetitorsForSubject(input)) {
      if (merged.length >= 3) break;
      push({ name: p.name, positioning: p.positioning });
    }
  }

  return merged.slice(0, 3);
}
