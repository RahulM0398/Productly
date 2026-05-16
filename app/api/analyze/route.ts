import { NextRequest } from "next/server";
import { orchestrate } from "@/lib/agents/orchestrator";
import type { AnalyzeInput } from "@/types/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let input: AnalyzeInput;
  try {
    const body = (await req.json()) as Partial<AnalyzeInput>;
    if (!body.productName || typeof body.productName !== "string") {
      return new Response(
        JSON.stringify({ error: "productName is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    input = {
      productName: body.productName.trim(),
      productUrl: body.productUrl?.trim() || undefined,
      teamType: body.teamType || "Startup",
      useCase: body.useCase || "Engineering",
    };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = orchestrate(input);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
