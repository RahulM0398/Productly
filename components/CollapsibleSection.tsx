"use client";

import { useState } from "react";

type Props = {
  eyebrow: string;
  title: string;
  overview: string;
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/**
 * Shared section frame used by every report card.
 *
 * Always visible:
 *   - eyebrow (mono uppercase) + section number
 *   - bold sans-serif title
 *   - 1-2 sentence overview
 *   - toggle on the right
 *
 * Collapsed by default — click the header (or chevron) to expand and reveal
 * the detailed analysis (children). This keeps the report scannable.
 */
export function CollapsibleSection({
  eyebrow,
  title,
  overview,
  meta,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border border-ink">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-6 px-5 py-4 border-b border-ink hover:bg-wash transition-colors">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="label-eyebrow label-mute">{eyebrow}</span>
              {meta ? (
                <span className="mono-num text-[11px] label-mute">· {meta}</span>
              ) : null}
            </div>
            <h3 className="mt-1.5 text-[20px] md:text-[22px] font-semibold tracking-tight">
              {title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-snug label-mute max-w-3xl">
              {overview}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
            <span className="mono-num text-[11px] label-mute uppercase tracking-widest">
              {open ? "Hide details" : "Show details"}
            </span>
            <span
              aria-hidden
              className={`mono-num text-[14px] transition-transform ${
                open ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </div>
        </div>
      </button>

      {open ? <div className="bg-paper">{children}</div> : null}
    </section>
  );
}
