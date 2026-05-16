import type { DecisionState, ProductlyReport } from "@/types/report";

const COLOR: Record<DecisionState, string> = {
  "Strong Organizational Fit": "verdict-buy",
  "Needs Controlled Rollout": "verdict-trial",
  "Operational Concerns Identified": "verdict-watch",
  "Misaligned for Current Team": "verdict-avoid",
};

const SUBLINE: Record<DecisionState, string> = {
  "Strong Organizational Fit":
    "Product is operationally mature and aligns well with the buyer's workflows.",
  "Needs Controlled Rollout":
    "Promising — Productly recommends validating with a smaller team before company-wide adoption.",
  "Operational Concerns Identified":
    "Product has friction, maturity, or adoption risks that should be resolved before commitment.",
  "Misaligned for Current Team":
    "Product likely does not fit the team's workflows, scale, or operational environment.",
};

export function VerdictStamp({ report }: { report: ProductlyReport }) {
  const conf = report.confidence;

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink px-5 py-3">
        <div className="label-eyebrow">Productly · Organizational Decision Review</div>
        <div className="mono-num text-[11px] label-mute">
          {report.meta.degraded ? "MODE: DEGRADED · MOCK FALLBACK" : "MODE: LIVE"}
        </div>
      </header>

      <div className="px-6 py-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <div className="label-eyebrow label-mute">Subject of analysis</div>
            <h2 className="mt-1 text-[32px] md:text-[36px] font-medium tracking-tight leading-tight">
              {report.productName}
            </h2>
            {report.productUrl ? (
              <a
                href={report.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mono-num text-[12px] label-mute hover:text-ink underline underline-offset-4 decoration-mute/40"
              >
                {hostOf(report.productUrl)}
              </a>
            ) : null}
            <div className="mt-1 mono-num text-[11px] label-mute uppercase tracking-widest">
              {report.teamType} · {report.useCase}
            </div>
          </div>

          <div className="md:text-right md:min-w-[320px] md:max-w-[480px]">
            <div className="label-eyebrow label-mute">Recommended Decision</div>
            <div
              className={`display-serif mt-1.5 text-[26px] md:text-[30px] leading-tight whitespace-nowrap ${COLOR[report.decision]}`}
            >
              {report.decision}.
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              <span className="mono-num text-[11px] label-mute uppercase tracking-widest">
                Confidence
              </span>
              <div className="grid grid-cols-10 gap-[2px] w-[160px]">
                {Array.from({ length: 10 }).map((_, i) => {
                  const filled = i < confidenceBars(conf.level);
                  return (
                    <div
                      key={i}
                      className={`h-2 border border-ink ${filled ? "bg-ink" : ""}`}
                    />
                  );
                })}
              </div>
              <span className="mono-num text-[11px] label-mute uppercase tracking-widest">
                {conf.level}
              </span>
            </div>
          </div>
        </div>

        {/* Company brief — what the product actually is */}
        {report.companyBrief ? (
          <div className="mt-7 pt-6 border-t border-ink/20">
            <div className="label-eyebrow label-mute">About {report.productName}</div>
            <p className="mt-2 text-[14.5px] leading-snug max-w-3xl">
              {report.companyBrief}
            </p>
          </div>
        ) : null}

        {/* Executive summary */}
        <div className="mt-6">
          <div className="label-eyebrow label-mute">Executive summary</div>
          <p className="mt-2 text-[16px] leading-snug max-w-3xl">
            {report.executiveSummary}
          </p>
          <p className="mt-3 text-[13px] label-mute max-w-3xl">
            {SUBLINE[report.decision]}
          </p>
        </div>
      </div>

      <div className="px-6 py-5 border-t border-ink bg-wash">
        <div className="label-eyebrow label-mute">Why this decision</div>
        <p className="mt-2 text-[14px] leading-relaxed">{report.decisionReason}</p>
      </div>
    </section>
  );
}

function confidenceBars(level: "High" | "Medium" | "Low") {
  if (level === "High") return 9;
  if (level === "Medium") return 6;
  return 3;
}

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}
