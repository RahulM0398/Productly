import { readEnv } from "./env";
import type { Alternative } from "@/types/report";

/**
 * EverOS Agent API adapter.
 *
 * The exact endpoint shape varies by tenant. This adapter assumes an
 * OpenAI-style POST: `${EVEROS_BASE_URL}/agents/${EVEROS_AGENT_ID}/run` with a
 * JSON body of `{ input }` and expects a JSON response with either
 * `output` (string) or `result.text` (string). If your tenant uses a
 * different shape, this is the only file that needs to change.
 *
 * We use EverOS as a verifier sub-agent: given the research summary, return
 * named alternatives + flag any unverified pricing claims.
 */
export async function everOSVerify(opts: {
  productName: string;
  productUrl?: string;
  useCase: string;
  researchSummary: string;
}): Promise<{ alternatives: Alternative[]; verifierNotes: string } | null> {
  const key = readEnv("EVEROS_API_KEY");
  const baseUrl = readEnv("EVEROS_BASE_URL");
  const agentId = readEnv("EVEROS_AGENT_ID");
  if (!key || !baseUrl || !agentId) return null;

  const url = `${baseUrl.replace(/\/$/, "")}/agents/${agentId}/run`;
  const prompt = `You are a verifier sub-agent for a software-buying analyst.

Product: ${opts.productName}
URL: ${opts.productUrl || "n/a"}
Use case: ${opts.useCase}

Research summary:
${opts.researchSummary}

Task:
1. Identify 2 to 3 credible alternatives. For each, return a one-line positioning.
2. Flag any claims in the research summary that look unverified or marketing-only.

Respond with strict JSON:
{
  "alternatives": [{ "name": string, "url": string?, "positioning": string }],
  "verifierNotes": string
}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ input: prompt }),
    });
    if (!res.ok) {
      console.warn("[everos] non-ok", res.status);
      return null;
    }
    const data = await res.json();
    const text: string =
      data?.output ||
      data?.result?.text ||
      data?.choices?.[0]?.message?.content ||
      "";
    if (!text) return null;
    const json = safeJson<{ alternatives?: Alternative[]; verifierNotes?: string }>(text);
    if (!json) return null;
    return {
      alternatives: json.alternatives || [],
      verifierNotes: json.verifierNotes || "",
    };
  } catch (err) {
    console.warn("[everos] error", err);
    return null;
  }
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
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
