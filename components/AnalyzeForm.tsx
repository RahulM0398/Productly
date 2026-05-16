"use client";

import { useEffect, useRef } from "react";
import type { AnalyzeInput } from "@/types/report";

type Props = {
  value: AnalyzeInput;
  onChange: (next: AnalyzeInput) => void;
  onSubmit: () => void;
  loading: boolean;
};

const TEAM_TYPES = ["Startup", "SMB", "Enterprise"];
const USE_CASES = [
  "Engineering",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
  "Customer Success",
];

export function AnalyzeForm({ value, onChange, onSubmit, loading }: Props) {
  const productRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    productRef.current?.focus();
  }, []);

  function setField<K extends keyof AnalyzeInput>(k: K, v: AnalyzeInput[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <section className="border border-ink relative">
      <header className="flex items-center justify-between border-b border-ink px-5 py-3">
        <div className="label-eyebrow">Productly · Decision Review · Intake</div>
        <div className="mono-num text-[11px] label-mute">
          FORM-1 / {new Date().toISOString().slice(0, 10)}
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-x-10 gap-y-2 px-6 pt-6 pb-2">
        <Field label="Product name">
          <input
            ref={productRef}
            value={value.productName}
            onChange={(e) => setField("productName", e.target.value)}
            placeholder="Cursor"
            disabled={loading}
          />
        </Field>

        <Field label="Product URL (optional)">
          <input
            value={value.productUrl ?? ""}
            onChange={(e) => setField("productUrl", e.target.value)}
            placeholder="https://cursor.com"
            disabled={loading}
          />
        </Field>

        <Field label="Team type">
          <select
            value={value.teamType}
            onChange={(e) => setField("teamType", e.target.value)}
            disabled={loading}
          >
            {TEAM_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Use case">
          <select
            value={value.useCase}
            onChange={(e) => setField("useCase", e.target.value)}
            disabled={loading}
          >
            {USE_CASES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4 px-6 py-6 border-t border-ink mt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || value.productName.trim().length === 0}
          className="ink-button mono-num uppercase tracking-[0.18em] text-[12px]"
        >
          {loading ? (
            <span className="blink-caret">Agents running</span>
          ) : (
            "▸ Dispatch Agents"
          )}
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block py-3">
      <span className="label-eyebrow label-mute block mb-1">{label}</span>
      {children}
    </label>
  );
}
