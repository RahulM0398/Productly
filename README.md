# Productly

**Decision Intelligence for SaaS Adoption.**

Productly is an AI-powered SaaS Decision Review Engine. You give it a product and a buyer context. It runs two agents that evaluate whether the product is operationally, financially, and strategically worth adopting for your team — and outputs a structured organizational decision review, not a generic product review.

The engine answers questions like *"Will this scale for our team?"*, *"Will adoption fail?"*, *"Will this create workflow lock-in?"* — instead of *"Is this product good?"*.

Built as a decision document, not a chat UI: white paper, black ink, hairline rules, serif verdict, monospace data.

---

## The two agents

```
User → /api/analyze (SSE stream)
      → orchestrator
          ├── Market Intelligence Agent
          │     ├── Bright Data         (targeted SERP across Reddit, G2,
          │     │                        Hacker News, docs, pricing, alternatives;
          │     │                        Web Unlocker page extraction)
          │     ├── Perplexity          (citation-grounded community research)
          │     ├── OpenAI              (structured extraction → ResearchFindings)
          │     └── EverOS              (optional verifier sub-agent for alternatives)
          └── Organizational Decision Agent
                ├── Qwen / Z.ai / OpenAI (configurable reasoning backend)
                └── OpenAI (fallback synthesis)
      → final ProductlyReport
```

Every external provider is behind a thin adapter. If a key is missing or a call fails, that provider is skipped and the pipeline degrades gracefully. Missing **everything** still produces a polished mock report so the UI always demos.

---

## The decision

Productly outputs one of four **SaaS Decision States** (no Buy/Trial/Watch/Avoid stock-trading language):

| State | Meaning |
| --- | --- |
| Strong Organizational Fit | Product is mature and aligns well operationally |
| Needs Controlled Rollout | Promising, but should be validated with a smaller team first |
| Operational Concerns Identified | Product has friction, maturity, or adoption risks |
| Misaligned for Current Team | Product likely does not fit current workflows or needs |

The full report covers:

1. **Executive Decision Summary** — hero verdict + reason + confidence
2. **Organizational Fit Analysis** — best-fit and weak-fit contexts
3. **Operational Readiness Review** — implementation, workflow disruption, training, integration maturity, admin & governance, support & docs, scalability
4. **User Adoption Intelligence** — what users love / struggle with / where adoption fails / power-user vs normal-user gap / long-term frustration patterns
5. **Financial & Scaling Signals** — pricing predictability, scaling cost, hidden enterprise patterns, ROI likelihood, seat expansion risk, over-adoption risk
6. **Workflow Dependency Analysis** — embedding depth, migration difficulty, process dependency, knowledge lock-in, integration lock-in
7. **Decision Confidence Layer** — High / Medium / Low with named reasons
8. **Alternative Solutions** — 3 current competitors with positioning + links
9. **Source bibliography** — every URL the engine relied on

Each section is collapsible. Every card shows a 1–2 sentence overview by default; clicking "show details" reveals the full analysis.

---

## Quick start

```bash
cp .env.local.example .env.local   # paste your API keys
npm install
npm run dev
```

Then open `http://localhost:3000`.

---

## Configuration

All keys go in `.env.local`. See `.env.local.example` for the full list. The minimum useful configuration is:

| Provider | Purpose | Required env vars |
| --- | --- | --- |
| OpenAI | structured extraction + reasoning + synthesis | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Bright Data | SERP + page unlocker (Reddit, G2, HN, docs, pricing) | `BRIGHTDATA_API_KEY`, `BRIGHTDATA_SERP_ZONE`, `BRIGHTDATA_UNLOCKER_ZONE` |
| Perplexity | grounded community research | `PERPLEXITY_API_KEY` |
| Qwen Cloud | alternative reasoning backend | `QWEN_API_KEY` |
| Z.ai | alternative reasoning backend | `ZAI_API_KEY` |
| EverOS | optional verifier sub-agent for alternatives | `EVEROS_API_KEY`, `EVEROS_BASE_URL`, `EVEROS_AGENT_ID` |
| AgentField | optional orchestration narrative telemetry | `AGENTFIELD_API_KEY`, `AGENTFIELD_BASE_URL`, `AGENTFIELD_WORKFLOW_ID` |

Choose your reasoning backend with `REASONING_PROVIDER=openai`, `qwen`, or `zai`. If the primary backend fails, Productly transparently falls through to the others that are configured.

---

## Project layout

```
app/
  page.tsx                  # hero + form + streaming progress + report sections
  api/analyze/route.ts      # SSE endpoint
  layout.tsx, globals.css   # design tokens + fonts
components/
  AnalyzeForm.tsx           # intake form
  ProgressBar.tsx           # single progress bar + live source extraction
  VerdictStamp.tsx          # executive decision summary + confidence
  CollapsibleSection.tsx    # shared expand-on-click section frame
  OrganizationalFit.tsx     # best-fit / weak-fit columns
  DimensionList.tsx         # readiness / financial / workflow rows
  AdoptionIntelligence.tsx  # loves / struggles / failure modes
  ConfidenceLayer.tsx       # High/Medium/Low + reasons
  AlternativesRibbon.tsx    # 3 current competitors
  SourceList.tsx            # bibliography
lib/
  agents/
    orchestrator.ts                 # SSE pipeline + AgentField telemetry
    researchAgent.ts                # Market Intelligence Agent
    decisionAgent.ts                # Organizational Decision Agent
  providers/
    openai.ts, perplexity.ts,
    brightData.ts (SERP + Unlocker + targeted multi-query),
    qwen.ts (routes qwen / zai / openai),
    everOS.ts, agentField.ts, env.ts
  prompts/
    researchExtract.ts, decisionScore.ts
  schema.ts                         # Zod validation
  mockReport.ts                     # full-fidelity fallback
  stream.ts                         # SSE emitter
  sseClient.ts                      # POST-friendly SSE reader
types/
  report.ts                         # central type definitions
```

---

## Streaming contract

`POST /api/analyze` returns `text/event-stream`. Event types:

| event | payload |
| --- | --- |
| `progress` | `{ pct, label, phase, ts }` — drives the progress bar |
| `source` | `{ title, url, type }` — populates the live source list during the run |
| `final` | full `ProductlyReport` JSON |
| `error` | `{ message }` — UI shows a degraded notice and falls back to the mock report |

---

## Demo script

1. Type `Cursor` (the URL auto-fills if you paste a brief).
2. Click **Dispatch Agents**.
3. Watch the progress bar fill as Bright Data scrapes pricing pages, Reddit threads, G2 reviews, and Hacker News discussions.
4. The report renders: decision state, confidence, company brief, executive summary, and six collapsible sections covering organizational fit, operational readiness, user adoption, financial signals, workflow dependency, and confidence.
5. Three current alternatives with working links and a full source bibliography appear at the bottom.

---

## License

MIT — see [LICENSE](LICENSE).
