import { readEnv } from "./env";

/**
 * AgentField — agent orchestration narrative runtime.
 *
 * Two responsibilities:
 *   1. `startRun` opens a run on AgentField (if configured) so that the
 *      narrative can be replayed/inspected outside of the live UI.
 *   2. `emit` fires off a single status update.
 *
 * If AgentField is not configured we no-op silently. The orchestrator
 * always emits an equivalent local SSE event regardless, so the UX is
 * identical in either case.
 */
export type AgentFieldRun = { runId: string } | null;

export async function startRun(opts: {
  productName: string;
  teamType: string;
  useCase: string;
}): Promise<AgentFieldRun> {
  const key = readEnv("AGENTFIELD_API_KEY");
  const baseUrl = readEnv("AGENTFIELD_BASE_URL");
  const workflowId = readEnv("AGENTFIELD_WORKFLOW_ID");
  if (!key || !baseUrl || !workflowId) return null;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        input: opts,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const runId: string | undefined = data?.run_id || data?.id;
    if (!runId) return null;
    return { runId };
  } catch (err) {
    console.warn("[agentfield] startRun error", err);
    return null;
  }
}

export async function emit(
  run: AgentFieldRun,
  payload: { agent: string; message: string; data?: unknown }
): Promise<void> {
  if (!run) return;
  const key = readEnv("AGENTFIELD_API_KEY");
  const baseUrl = readEnv("AGENTFIELD_BASE_URL");
  if (!key || !baseUrl) return;

  try {
    await fetch(`${baseUrl.replace(/\/$/, "")}/runs/${run.runId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        type: "narrative",
        ...payload,
        ts: Date.now(),
      }),
    });
  } catch {
    // best-effort; never throws into the request path
  }
}

export async function finishRun(run: AgentFieldRun, status: "ok" | "error"): Promise<void> {
  if (!run) return;
  const key = readEnv("AGENTFIELD_API_KEY");
  const baseUrl = readEnv("AGENTFIELD_BASE_URL");
  if (!key || !baseUrl) return;

  try {
    await fetch(`${baseUrl.replace(/\/$/, "")}/runs/${run.runId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ status }),
    });
  } catch {
    // ignore
  }
}
