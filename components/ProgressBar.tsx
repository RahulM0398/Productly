"use client";

import type { SourceLink } from "@/types/report";

type Props = {
  pct: number;
  label: string;
  running: boolean;
  sources: SourceLink[];
};

export function ProgressBar({ pct, label, running, sources }: Props) {
  const segments = 40;
  const filled = Math.round((pct / 100) * segments);

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink px-5 py-3">
        <div className="label-eyebrow">
          {running ? "Extracting information from sources" : "Run complete"}
        </div>
        <div className="mono-num text-[11px] label-mute">
          {pct.toString().padStart(3, "0")}%
        </div>
      </header>

      <div className="px-5 py-5">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${segments}, 1fr)` }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`h-3 border border-ink ${i < filled ? "bg-ink" : ""} ${
                running && i === filled ? "scanline" : ""
              }`}
            />
          ))}
        </div>

        <div className="mt-4 mono-num text-[12px] leading-relaxed">
          {running ? (
            <span className="blink-caret">{label || "Awaiting first signal"}</span>
          ) : (
            <span className="label-mute">{label || "Completed"}</span>
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-5 pt-4 border-t border-ink">
            <div className="label-eyebrow label-mute mb-2">
              Sources extracted · {sources.length.toString().padStart(2, "0")}
            </div>
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1">
              {sources.slice(-8).map((s, i) => (
                <li key={s.url + i} className="flex gap-3 min-w-0">
                  <span className="mono-num text-[10px] label-mute uppercase tracking-widest w-[60px] shrink-0">
                    {s.type}
                  </span>
                  <span className="mono-num text-[11px] truncate flex-1">
                    {shortUrl(s.url)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}
