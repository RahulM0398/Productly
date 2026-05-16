import type { ProductlyReport } from "@/types/report";

export function ConfidenceLayerDetail({ report }: { report: ProductlyReport }) {
  const conf = report.confidence;
  return (
    <div className="grid md:grid-cols-[260px_1fr]">
      <div className="px-6 py-6 border-r border-ink">
        <div className="label-eyebrow label-mute">Confidence Level</div>
        <div className="display-serif text-[44px] md:text-[56px] leading-none mt-2">
          {conf.level}.
        </div>
        <div className="mt-4 grid grid-cols-10 gap-[2px]">
          {Array.from({ length: 10 }).map((_, i) => {
            const filled =
              i < (conf.level === "High" ? 9 : conf.level === "Medium" ? 6 : 3);
            return (
              <div key={i} className={`h-2 border border-ink ${filled ? "bg-ink" : ""}`} />
            );
          })}
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="label-eyebrow label-mute">Why this confidence</div>
        <ul className="mt-3 space-y-2 text-[13.5px] leading-snug">
          {conf.reasons.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="mono-num text-[11px] label-mute w-[24px] shrink-0">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
