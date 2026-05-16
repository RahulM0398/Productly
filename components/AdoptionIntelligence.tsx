import type { ProductlyReport } from "@/types/report";

export function AdoptionIntelligenceDetail({ report }: { report: ProductlyReport }) {
  const ai = report.adoptionIntelligence;
  return (
    <>
      <div className="grid md:grid-cols-3 grid-rule md:grid-rule-x">
        <List label="Users love" items={ai.usersLove} tone="positive" />
        <List label="Users struggle with" items={ai.usersStruggleWith} tone="caution" />
        <List
          label="Where adoption fails"
          items={ai.adoptionFailurePoints}
          tone="critical"
        />
      </div>
      <div className="grid md:grid-cols-2 border-t border-ink grid-rule md:grid-rule-x">
        <div className="px-5 py-4">
          <div className="label-eyebrow label-mute">Power-user vs normal-user gap</div>
          <p className="mt-2 text-[14px] leading-snug">{ai.powerUserGap}</p>
        </div>
        <div className="px-5 py-4">
          <div className="label-eyebrow label-mute">Long-term frustration patterns</div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug">
            {ai.longTermFrustrations.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="mono-num text-[11px] label-mute shrink-0">·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function List({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "positive" | "caution" | "critical";
}) {
  return (
    <div>
      <div className="px-5 py-3 border-b border-ink flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <span className="mono-num text-[11px] label-mute">
          {items.length.toString().padStart(2, "0")}
        </span>
      </div>
      <ul className="grid-rule">
        {items.map((it, i) => (
          <li
            key={i}
            className="px-5 py-3 text-[13.5px] leading-snug flex gap-3"
          >
            <span className="mono-num text-[11px] label-mute w-[24px] shrink-0">
              {tone === "positive" ? "+" : tone === "caution" ? "·" : "!"}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
