import type { ProductlyReport } from "@/types/report";
import { resolveOfficialProductUrl } from "@/lib/alternativeUrls";

function linkLabel(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("google.") && u.pathname.startsWith("/search")) {
      return "Search for official site";
    }
    const h = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return h + path;
  } catch {
    return url;
  }
}

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
        {alts.slice(0, 3).map((a, i) => {
          const href = resolveOfficialProductUrl(a.name, a.url);
          const label = linkLabel(href);
          return (
            <li key={a.name + i} className="px-5 py-5">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block hover:opacity-90"
              >
                <h4 className="text-[18px] font-semibold tracking-tight text-ink underline decoration-ink/30 underline-offset-4 group-hover:decoration-ink">
                  {a.name}
                </h4>
                <span className="mt-1.5 block mono-num text-[12px] text-ink/80 break-all">
                  {label}
                </span>
              </a>
              <p className="mt-3 text-[13.5px] label-mute leading-snug">
                {a.positioning}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
