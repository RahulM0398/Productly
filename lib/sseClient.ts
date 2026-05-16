/**
 * Tiny SSE client that supports POST + ReadableStream.
 * Native EventSource does not allow POST bodies, so we roll our own
 * parser over fetch's streaming body.
 */
export type SSEHandler = (event: string, data: unknown) => void;

export async function streamSSE(
  url: string,
  body: unknown,
  onEvent: SSEHandler,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`SSE request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";
    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let event = "message";
      let dataRaw = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
      }
      if (dataRaw) {
        try {
          onEvent(event, JSON.parse(dataRaw));
        } catch {
          onEvent(event, dataRaw);
        }
      }
    }
  }
}
