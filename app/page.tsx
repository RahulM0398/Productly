"use client";

import { useCallback, useRef, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { ProgressBar } from "@/components/ProgressBar";
import { VerdictStamp } from "@/components/VerdictStamp";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OrganizationalFitDetail } from "@/components/OrganizationalFit";
import { DimensionList } from "@/components/DimensionList";
import { AdoptionIntelligenceDetail } from "@/components/AdoptionIntelligence";
import { ConfidenceLayerDetail } from "@/components/ConfidenceLayer";
import { AlternativesRibbon } from "@/components/AlternativesRibbon";
import { SourceList } from "@/components/SourceList";
import {
  OPERATIONAL_LABELS,
  FINANCIAL_LABELS,
  WORKFLOW_LABELS,
  type AnalyzeInput,
  type ProductlyReport,
  type SourceLink,
} from "@/types/report";
import { streamSSE } from "@/lib/sseClient";

export default function Home() {
  const [input, setInput] = useState<AnalyzeInput>({
    productName: "",
    productUrl: "",
    teamType: "Startup",
    useCase: "Engineering",
  });
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, label: "" });
  const [sources, setSources] = useState<SourceLink[]>([]);
  const [report, setReport] = useState<ProductlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const onSubmit = useCallback(async () => {
    if (!input.productName.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunning(true);
    setError(null);
    setReport(null);
    setSources([]);
    setProgress({ pct: 0, label: "Dispatching agents" });

    try {
      await streamSSE(
        "/api/analyze",
        input,
        (event, data) => {
          if (event === "progress") {
            const d = data as { pct: number; label: string; phase: string };
            setProgress({ pct: d.pct, label: d.label });
          } else if (event === "source") {
            const d = data as SourceLink;
            setSources((prev) => (prev.find((s) => s.url === d.url) ? prev : [...prev, d]));
          } else if (event === "final") {
            setReport(data as ProductlyReport);
          } else if (event === "error") {
            setError((data as { message: string }).message);
          }
        },
        controller.signal
      );
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [input]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Top />
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 pb-32">
        <Hero />

        <div className="mt-10">
          <AnalyzeForm
            value={input}
            onChange={setInput}
            onSubmit={onSubmit}
            loading={running}
          />
        </div>

        {(running || (progress.pct > 0 && !report)) && (
          <div className="mt-8">
            <ProgressBar
              pct={progress.pct}
              label={progress.label}
              running={running}
              sources={sources}
            />
          </div>
        )}

        {error && !running && (
          <div className="mt-8 border border-ink px-5 py-4 mono-num text-[12px] flex items-center justify-between">
            <span className="label-eyebrow">Stream error</span>
            <span>{error}</span>
          </div>
        )}

        {report && (
          <div className="mt-12 space-y-6">
            {report.meta.degraded && (
              <div className="border border-ink px-5 py-3 mono-num text-[11px] flex items-center justify-between gap-4 bg-wash">
                <span className="label-eyebrow shrink-0">Notice</span>
                <span className="text-right">
                  Reasoning provider unavailable — content below is from the mock fallback. Add a working reasoning key for a fully live decision.
                </span>
              </div>
            )}

            <VerdictStamp report={report} />

            <CollapsibleSection
              eyebrow="Section 01"
              title="Organizational Fit Analysis"
              meta="who this product is for"
              overview={report.organizationalFit.overview}
              defaultOpen
            >
              <OrganizationalFitDetail report={report} />
            </CollapsibleSection>

            <CollapsibleSection
              eyebrow="Section 02"
              title="Operational Readiness Review"
              meta="implementation · workflow · governance · scale"
              overview={report.operationalReadiness.overview}
            >
              <DimensionList
                rows={Object.entries(OPERATIONAL_LABELS).map(([key, label]) => ({
                  label,
                  value:
                    report.operationalReadiness[
                      key as keyof typeof report.operationalReadiness
                    ] as string,
                }))}
              />
            </CollapsibleSection>

            <CollapsibleSection
              eyebrow="Section 03"
              title="User Adoption Intelligence"
              meta="synthesized from Reddit · G2 · Hacker News · reviews"
              overview={report.adoptionIntelligence.overview}
            >
              <AdoptionIntelligenceDetail report={report} />
            </CollapsibleSection>

            <CollapsibleSection
              eyebrow="Section 04"
              title="Financial & Scaling Signals"
              meta="predictability · expansion · ROI"
              overview={report.financialSignals.overview}
            >
              <DimensionList
                rows={Object.entries(FINANCIAL_LABELS).map(([key, label]) => ({
                  label,
                  value:
                    report.financialSignals[
                      key as keyof typeof report.financialSignals
                    ] as string,
                }))}
              />
            </CollapsibleSection>

            <CollapsibleSection
              eyebrow="Section 05"
              title="Workflow Dependency Analysis"
              meta="how deeply this embeds into the team"
              overview={report.workflowDependency.overview}
            >
              <DimensionList
                rows={Object.entries(WORKFLOW_LABELS).map(([key, label]) => ({
                  label,
                  value:
                    report.workflowDependency[
                      key as keyof typeof report.workflowDependency
                    ] as string,
                }))}
              />
            </CollapsibleSection>

            <CollapsibleSection
              eyebrow="Section 06"
              title="Decision Confidence"
              meta="how certain Productly is"
              overview={`${report.confidence.level} confidence. ${report.confidence.reasons[0] || ""}`}
            >
              <ConfidenceLayerDetail report={report} />
            </CollapsibleSection>

            <AlternativesRibbon report={report} />

            <SourceList report={report} />
          </div>
        )}

        {!report && !running && progress.pct === 0 && <ValueProp />}
      </div>
    </main>
  );
}

function Top() {
  return (
    <header className="border-b border-ink">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-ink" />
          <span className="font-medium tracking-tight">Productly</span>
          <span className="mono-num text-[11px] label-mute">v0.1</span>
        </div>
        <nav className="mono-num text-[11px] label-mute hidden md:flex items-center gap-5">
          <span>AI Decision Engine for Software Buying</span>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-12 pb-2">
      <div className="label-eyebrow label-mute">
        Decision Intelligence for SaaS Adoption
      </div>

      <h1 className="display-serif mt-3 text-[34px] md:text-[48px] leading-[1.1] tracking-tight max-w-3xl">
        Before your team adopts software,
        <br />
        <span className="italic">Productly stress-tests the decision.</span>
      </h1>

      <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed">
        Two agents evaluate every SaaS decision.
      </p>

      <ul className="mt-3 max-w-2xl space-y-2 text-[14px] leading-relaxed label-mute">
        <li className="flex gap-3">
          <span className="mono-num text-[11px] label-mute shrink-0 w-[24px] pt-1 uppercase tracking-widest">
            01
          </span>
          <span>
            <strong className="text-ink font-semibold">Market Intelligence Agent</strong>{" "}
            — pulls live signal from the product&apos;s pages, Reddit, G2, and Hacker News.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mono-num text-[11px] label-mute shrink-0 w-[24px] pt-1 uppercase tracking-widest">
            02
          </span>
          <span>
            <strong className="text-ink font-semibold">Organizational Decision Agent</strong>{" "}
            — evaluates whether the product fits your team&apos;s workflows, scale, and
            operational environment.
          </span>
        </li>
      </ul>
    </section>
  );
}

function ValueProp() {
  const items = [
    {
      step: "01",
      title: "Market Intelligence Agent",
      body: "Gathers live signal from the product's website, pricing, docs, Reddit threads, G2 reviews, and Hacker News — through Bright Data, Perplexity, and OpenAI.",
    },
    {
      step: "02",
      title: "Organizational Decision Agent",
      body: "Evaluates organizational fit, operational readiness, adoption risk, financial scaling, workflow dependency, and confidence — not a generic product review.",
    },
    {
      step: "03",
      title: "Decision Review",
      body: "Outputs a structured Organizational Decision Review with a clear recommendation: Strong Organizational Fit, Needs Controlled Rollout, Operational Concerns Identified, or Misaligned for Current Team.",
    },
  ];
  return (
    <section className="mt-14 border-t border-ink">
      <div className="grid md:grid-cols-3 grid-rule md:grid-rule-x border-b border-ink">
        {items.map((it) => (
          <div key={it.step} className="px-6 py-7">
            <div className="mono-num text-[12px] label-mute">{it.step}</div>
            <h3 className="mt-3 text-[18px] font-medium tracking-tight">{it.title}</h3>
            <p className="mt-2 text-[13px] label-mute leading-snug">{it.body}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-4 grid-rule md:grid-rule-x text-[12px]">
        {[
          "Strong Organizational Fit",
          "Needs Controlled Rollout",
          "Operational Concerns Identified",
          "Misaligned for Current Team",
        ].map((d, i) => (
          <div key={d} className="px-4 py-5">
            <div className="mono-num label-mute text-[10px] uppercase tracking-widest">
              state {(i + 1).toString().padStart(2, "0")}
            </div>
            <div className="mt-2">{d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
