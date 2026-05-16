import type { ProductlyReport } from "@/types/report";

export function SourceList({ report }: { report: ProductlyReport }) {
  if (report.sourceLinks.length === 0) return null;
  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink px-5 py-3">
        <div className="label-eyebrow">Bibliography · Source citations</div>
        <div className="mono-num text-[11px] label-mute">
          {report.sourceLinks.length.toString().padStart(2, "0")} sources
        </div>
      </header>
      <ol className="grid md:grid-cols-2 grid-rule md:grid-rule-x">
        {report.sourceLinks.map((s, i) => (
          <li key={s.url + i} className="px-5 py-3 flex gap-3 min-w-0">
            <span className="mono-num text-[11px] label-mute w-[30px] shrink-0 pt-0.5">
              [{(i + 1).toString().padStart(2, "0")}]
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] truncate underline underline-offset-4 decoration-ink/30 hover:decoration-ink"
              >
                {s.title || s.url}
              </a>
              <span className="mono-num text-[10px] label-mute uppercase tracking-widest">
                {s.type}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
