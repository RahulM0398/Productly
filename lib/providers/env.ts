export function readEnv(name: string): string | null {
  const v = process.env[name];
  if (!v || v.trim().length === 0) return null;
  return v.trim();
}

export function hasAll(...names: string[]): boolean {
  return names.every((n) => readEnv(n) !== null);
}

export type ReasoningChoice = "qwen" | "zai" | "openai" | "none";

export type ProviderStatus = {
  brightData: boolean;
  perplexity: boolean;
  openai: boolean;
  reasoning: ReasoningChoice;
  everOS: boolean;
  agentField: boolean;
};

export function detectProviders(): ProviderStatus {
  const choice = (readEnv("REASONING_PROVIDER") || "qwen").toLowerCase();
  const ready = {
    qwen: hasAll("QWEN_API_KEY"),
    zai: hasAll("ZAI_API_KEY"),
    openai: hasAll("OPENAI_API_KEY"),
  };

  let reasoning: ReasoningChoice = "none";
  const preferred = ["qwen", "zai", "openai"] as const;
  if (preferred.includes(choice as (typeof preferred)[number]) && ready[choice as keyof typeof ready]) {
    reasoning = choice as ReasoningChoice;
  } else if (ready.qwen) reasoning = "qwen";
  else if (ready.zai) reasoning = "zai";
  else if (ready.openai) reasoning = "openai";

  return {
    brightData: hasAll("BRIGHTDATA_API_KEY"),
    perplexity: hasAll("PERPLEXITY_API_KEY"),
    openai: ready.openai,
    reasoning,
    everOS: hasAll("EVEROS_API_KEY"),
    agentField: hasAll("AGENTFIELD_API_KEY"),
  };
}
