import { readEnv } from "./env";

export type PerplexityResult = {
  text: string;
  citations: { title: string; url: string }[];
};

export async function perplexitySearch(opts: {
  prompt: string;
  recencyDays?: number;
}): Promise<PerplexityResult | null> {
  const key = readEnv("PERPLEXITY_API_KEY");
  if (!key) return null;
  const model = readEnv("PERPLEXITY_MODEL") || "sonar-pro";

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a buying-intelligence researcher. Return concise, citation-grounded findings. Avoid speculation. Prefer first-party sources, then high-signal community sources (Reddit, Hacker News, G2, Capterra).",
          },
          { role: "user", content: opts.prompt },
        ],
        temperature: 0.2,
        return_citations: true,
        return_related_questions: false,
        search_recency_filter: opts.recencyDays && opts.recencyDays <= 30 ? "month" : "year",
      }),
    });
    if (!res.ok) {
      console.warn("[perplexity] non-ok", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content || "";
    const rawCitations: unknown = data?.citations || data?.choices?.[0]?.message?.citations || [];

    const citations: { title: string; url: string }[] = [];
    if (Array.isArray(rawCitations)) {
      for (const c of rawCitations) {
        if (typeof c === "string") {
          citations.push({ title: hostFromUrl(c), url: c });
        } else if (c && typeof c === "object" && "url" in (c as Record<string, unknown>)) {
          const obj = c as Record<string, unknown>;
          citations.push({
            title: (obj.title as string) || hostFromUrl(obj.url as string),
            url: obj.url as string,
          });
        }
      }
    }

    return { text, citations };
  } catch (err) {
    console.warn("[perplexity] error", err);
    return null;
  }
}

function hostFromUrl(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}
