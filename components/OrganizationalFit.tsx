import type { ProductlyReport } from "@/types/report";

export function OrganizationalFitDetail({ report }: { report: ProductlyReport }) {
  return (
    <div className="grid md:grid-cols-2">
      <Column label="Best Fit" items={report.organizationalFit.bestFit} />
      <Column label="Weak Fit" items={report.organizationalFit.weakFit} warn />
    </div>
  );
}

function Column({
  label,
  items,
  warn,
}: {
  label: string;
  items: string[];
  warn?: boolean;
}) {
  return (
    <div className="border-l border-ink first:border-l-0">
      <div className="px-5 py-3 border-b border-ink flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <span className="mono-num text-[11px] label-mute">
          {items.length.toString().padStart(2, "0")}
        </span>
      </div>
      <ul className="grid-rule">
        {items.map((it, i) => (
          <li key={i} className="px-5 py-3.5 flex gap-3 text-[13.5px] leading-snug">
            <span className="mono-num text-[11px] label-mute w-[24px] shrink-0">
              {warn ? "—" : "+"}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
