import { readEnv } from "./env";

export type ReasoningProvider = "qwen" | "zai" | "openai";

/**
 * Reasoning provider router. Supports three OpenAI-compatible backends:
 *   - Qwen Cloud (Alibaba DashScope)
 *   - Z.ai (GLM)
 *   - OpenAI (gpt-4o-mini / gpt-4o / etc.)
 *
 * The primary provider is chosen by REASONING_PROVIDER. If the primary fails
 * (rate limit, invalid key, model rejection), we transparently fall through
 * to the other configured providers in order.
 */
export async function reason<T = unknown>(opts: {
  system: string;
  user: string;
  jsonOnly?: boolean;
  schemaHint?: string;
  temperature?: number;
}): Promise<{ provider: ReasoningProvider; data: T } | null> {
  const choice = (readEnv("REASONING_PROVIDER") || "qwen").toLowerCase() as ReasoningProvider;

  const keys = {
    qwen: readEnv("QWEN_API_KEY"),
    zai: readEnv("ZAI_API_KEY"),
    openai: readEnv("OPENAI_API_KEY"),
  };

  const all: ReasoningProvider[] = ["qwen", "zai", "openai"];
  const order: ReasoningProvider[] = [
    choice,
    ...all.filter((p) => p !== choice),
  ];

  for (const provider of order) {
    if (!keys[provider]) continue;
    const config = providerConfig(provider, keys[provider]!);
    const result = await callOpenAICompat<T>({ ...config, ...opts });
    if (result) return { provider, data: result };
  }
  return null;
}

function providerConfig(
  provider: ReasoningProvider,
  apiKey: string
): { baseUrl: string; apiKey: string; model: string } {
  if (provider === "qwen") {
    return {
      baseUrl:
        readEnv("QWEN_BASE_URL") ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      apiKey,
      model: readEnv("QWEN_MODEL") || "qwen3-max",
    };
  }
  if (provider === "zai") {
    return {
      baseUrl: readEnv("ZAI_BASE_URL") || "https://api.z.ai/api/paas/v4",
      apiKey,
      model: readEnv("ZAI_MODEL") || "glm-4.6",
    };
  }
  return {
    baseUrl: "https://api.openai.com/v1",
    apiKey,
    model: readEnv("OPENAI_MODEL") || "gpt-4o-mini",
  };
}

async function callOpenAICompat<T>(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  jsonOnly?: boolean;
  schemaHint?: string;
  temperature?: number;
}): Promise<T | null> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const messages = [
    {
      role: "system",
      content:
        opts.system +
        (opts.jsonOnly
          ? "\n\nYou MUST respond with a single valid JSON object. No prose, no markdown fences."
          : "") +
        (opts.schemaHint ? `\n\nSchema:\n${opts.schemaHint}` : ""),
    },
    { role: "user", content: opts.user },
  ];

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.jsonOnly) {
    body.response_format = { type: "json_object" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[reason]", opts.baseUrl, "non-ok", res.status);
      return null;
    }
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) return null;
    if (opts.jsonOnly) {
      return safeJson<T>(text);
    }
    return text as unknown as T;
  } catch (err) {
    console.warn("[reason] error", err);
    return null;
  }
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // try to extract first JSON object
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
