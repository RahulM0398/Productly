import type { ProductlyReport, SourceLink } from "@/types/report";

export type Emitter = {
  progress: (pct: number, label: string, phase: string) => void;
  source: (s: SourceLink) => void;
  final: (report: ProductlyReport) => void;
  error: (message: string) => void;
  close: () => void;
};

export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>;
  emitter: Emitter;
} {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      closed = true;
    },
  });

  function send(event: string, data: unknown) {
    if (closed) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    try {
      controller.enqueue(encoder.encode(payload));
    } catch {
      closed = true;
    }
  }

  const emitter: Emitter = {
    progress: (pct, label, phase) =>
      send("progress", { pct: Math.max(0, Math.min(100, Math.round(pct))), label, phase, ts: Date.now() }),
    source: (s) => send("source", s),
    final: (report) => send("final", report),
    error: (message) => send("error", { message }),
    close: () => {
      if (closed) return;
      closed = true;
      try {
        controller.close();
      } catch {
        // already closed
      }
    },
  };

  return { stream, emitter };
}
