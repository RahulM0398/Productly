import { readEnv } from "./env";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function openaiJSON<T = unknown>(opts: {
  system: string;
  user: string;
  schemaHint?: string;
  model?: string;
  temperature?: number;
}): Promise<T | null> {
  const key = readEnv("OPENAI_API_KEY");
  if (!key) return null;
  const model = opts.model || readEnv("OPENAI_MODEL") || "gpt-4o-mini";

  const messages: Msg[] = [
    {
      role: "system",
      content:
        opts.system +
        "\n\nYou MUST respond with a single valid JSON object. No prose, no markdown fences." +
        (opts.schemaHint ? `\n\nSchema:\n${opts.schemaHint}` : ""),
    },
    { role: "user", content: opts.user },
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.warn("[openai] non-ok", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn("[openai] error", err);
    return null;
  }
}
