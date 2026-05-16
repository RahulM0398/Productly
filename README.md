# Productly

**Live app:** [**https://productly-five.vercel.app**](https://productly-five.vercel.app/)

**Decision Intelligence for SaaS Adoption** — an AI-powered **SaaS Decision Review Engine** (not a chatbot or review site). You enter a product + buyer context; two agents return a structured **organizational adoption decision** with evidence-backed sections.

---

## What it does (features)

- **Two-agent pipeline** — **Market Intelligence** (web + community signal) → **Organizational Decision** (fit, risk, rollout).
- **Four decision states** — *Strong Organizational Fit*, *Needs Controlled Rollout*, *Operational Concerns Identified*, *Misaligned for Current Team* (replacing Buy/Trial/Watch/Avoid).
- **Structured report** — executive summary, company brief, organizational fit (best/weak), operational readiness (7 dimensions), user adoption intelligence, financial & scaling signals, workflow dependency analysis, decision confidence, **three alternatives** with links, **source bibliography**.
- **Collapsible sections** — short overview visible by default; **Show details** expands full analysis (less wall-of-text).
- **Live run UX** — **SSE** progress + **per-source extraction** list during the run; graceful degradation to a mock report if APIs are missing or fail.

---

## Stack & integrations

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS** |
| Streaming | **Server-Sent Events** — `POST /api/analyze` returns `text/event-stream` |
| Validation | **Zod** (`lib/schema.ts`) for `ResearchFindings` + decision JSON |
| Research | **Bright Data** (parallel SERP + Web Unlocker), optional **Perplexity**, **OpenAI** extraction |
| Reasoning | **OpenAI / Qwen / Z.ai** via **`lib/providers/qwen.ts`** with fallback |
| Optional | **EverOS** (verifier), **AgentField** (run telemetry) |

---

## Important UI components

| File | Role |
| --- | --- |
| `app/page.tsx` | Hero, intake form, SSE client, progress + full report layout |
| `app/loading.tsx` | First-paint skeleton while the route loads |
| `components/AnalyzeForm.tsx` | Product name, URL, team type, use case — **Dispatch Agents** |
| `components/ProgressBar.tsx` | Single extract progress bar + live **sources extracted** |
| `components/VerdictStamp.tsx` | Decision state, confidence, company brief, executive summary |
| `components/CollapsibleSection.tsx` | Reusable **overview + expand** pattern for every report block |
| `components/OrganizationalFit.tsx` | Best fit / weak fit detail body |
| `components/DimensionList.tsx` | Operational / financial / workflow dimension rows |
| `components/AdoptionIntelligence.tsx` | Loves, struggles, failure modes, power-user gap |
| `components/ConfidenceLayer.tsx` | Confidence level + reasons |
| `components/AlternativesRibbon.tsx` | Three alternatives with **open ↗** links |
| `components/SourceList.tsx` | Bibliography of URLs used |

---

## Important backend modules

| Path | Role |
| --- | --- |
| `lib/agents/orchestrator.ts` | Wires research → decision; merges provider meta; emits SSE |
| `lib/agents/researchAgent.ts` | **Market Intelligence Agent** — parallel SERP + optional Perplexity, concurrent unlocker fetches, OpenAI → `ResearchFindings` |
| `lib/agents/decisionAgent.ts` | **Organizational Decision Agent** — reasoning JSON → `ProductlyReport` |
| `lib/providers/brightData.ts` | SERP + targeted queries (Reddit, G2, HN, etc.) + page fetch |
| `lib/providers/openai.ts` | JSON-mode extraction / synthesis |
| `lib/prompts/researchExtract.ts`, `decisionScore.ts` | LLM system prompts + schemas |
| `lib/stream.ts`, `lib/sseClient.ts` | SSE emission (server) and fetch-based consumer (browser) |
| `types/report.ts` | All report + stream event types |

---

## Quick start

```bash
cp .env.local.example .env.local   # add keys you have (all optional for demo)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure providers in `.env.local` (see `.env.local.example`).

---

## License

MIT — see [LICENSE](LICENSE).
