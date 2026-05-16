import type { AnalyzeInput, ProductlyReport } from "@/types/report";
import { createSSEStream, type Emitter } from "@/lib/stream";
import { runMarketIntelligenceAgent } from "./researchAgent";
import { runOrganizationalDecisionAgent } from "./decisionAgent";
import { detectProviders } from "@/lib/providers/env";
import { mockReport } from "@/lib/mockReport";
import { startRun, emit as afEmit, finishRun } from "@/lib/providers/agentField";

export function orchestrate(input: AnalyzeInput) {
  const { stream, emitter } = createSSEStream();
  void runPipeline(input, emitter);
  return stream;
}

async function runPipeline(input: AnalyzeInput, emit: Emitter) {
  const providers = detectProviders();
  let report: ProductlyReport;

  const run = await startRun({
    productName: input.productName,
    teamType: input.teamType,
    useCase: input.useCase,
  });

  const wrapped: Emitter = {
    ...emit,
    progress: (pct, label, phase) => {
      emit.progress(pct, label, phase);
      void afEmit(run, { agent: phase, message: label });
    },
  };

  try {
    wrapped.progress(2, "Productly opening run", "init");
    const { findings, verifierNotes, researchMock } = await runMarketIntelligenceAgent(
      input,
      wrapped
    );
    const { report: built, reasoningProvider } = await runOrganizationalDecisionAgent(
      input,
      findings,
      verifierNotes,
      wrapped
    );

    report = built;
    const reasoningMock = reasoningProvider === "none";
    report.meta.providers = {
      brightData: providers.brightData,
      perplexity: providers.perplexity,
      openai: providers.openai,
      reasoning: reasoningProvider,
      everOS: providers.everOS,
      agentField: providers.agentField,
    };
    report.meta.researchMock = researchMock;
    report.meta.reasoningMock = reasoningMock;
    report.meta.degraded = researchMock || reasoningMock;

    wrapped.progress(100, `Run complete: ${report.decision}`, "complete");
    emit.final(report);
    await finishRun(run, "ok");
  } catch (err) {
    console.error("[orchestrator] failed:", err);
    emit.error((err as Error)?.message || "Unknown orchestration error");
    const fallback = mockReport(input);
    emit.final(fallback);
    await finishRun(run, "error");
  } finally {
    emit.close();
  }
}
