/**
 * Detail body used by Operational Readiness, Financial Signals, and Workflow
 * Dependency sections. The card frame (title + overview + toggle) lives in
 * CollapsibleSection; this just renders the table-style rows.
 */
type Props = {
  rows: { label: string; value: string }[];
};

export function DimensionList({ rows }: Props) {
  return (
    <ul className="grid-rule">
      {rows.map((r, i) => (
        <li
          key={i}
          className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-x-6 gap-y-1 px-5 py-3.5"
        >
          <div className="text-[13px] leading-tight">
            <div className="font-medium">{r.label}</div>
            <div className="mono-num text-[10px] label-mute uppercase tracking-widest mt-0.5">
              {String(i + 1).padStart(2, "0")} / {String(rows.length).padStart(2, "0")}
            </div>
          </div>
          <p className="text-[14px] leading-snug">{r.value}</p>
        </li>
      ))}
    </ul>
  );
}
