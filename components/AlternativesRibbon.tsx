import type { ProductlyReport } from "@/types/report";

export function AlternativesRibbon({ report }: { report: ProductlyReport }) {
  const alts = report.alternatives;
  if (!alts || alts.length === 0) return null;
  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink px-5 py-3">
        <div className="label-eyebrow">Alternative Solutions to Review</div>
        <div className="mono-num text-[11px] label-mute">
          credible substitutes worth comparing
        </div>
      </header>
      <ul className="grid md:grid-cols-3 grid-rule md:grid-rule-x">
        {alts.slice(0, 3).map((a, i) => (
          <li key={a.name + i} className="px-5 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-[18px] font-medium tracking-tight">{a.name}</h4>
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono-num text-[11px] label-mute underline underline-offset-4 hover:text-ink"
                >
                  open ↗
                </a>
              ) : (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(a.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono-num text-[11px] label-mute underline underline-offset-4 hover:text-ink"
                >
                  search ↗
                </a>
              )}
            </div>
            <p className="mt-3 text-[13.5px] label-mute leading-snug">
              {a.positioning}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
