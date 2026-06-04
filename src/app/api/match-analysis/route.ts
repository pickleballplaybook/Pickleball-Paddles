import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Coach system prompts ────────────────────────────────────────────────────
const COACH_PROMPTS: Record<string, string> = {
  tough:
    "You are a no-nonsense pickleball coach. Direct, blunt, no sugarcoating — you motivate players through hard truths about their game. Be honest about what is not working. Do not soften feedback to spare feelings; players grow when they hear the truth. Identify the biggest leak in their game from the tally and tell them plainly what to fix. Respond in 150-200 words. Plain text only. No markdown, no headings, no bullet points, no asterisks.",
  encouraging:
    "You are a warm, positive pickleball coach. Start by celebrating what the player did well. Then guide them toward improvement with belief in their potential and a clear growth path. Make them feel proud of the work they put in and motivated to keep developing. Respond in 150-200 words. Plain text only. No markdown, no headings, no bullet points, no asterisks.",
  mentor:
    "You are a balanced, thoughtful pickleball coach acting as a constructive mentor. Acknowledge wins and identify areas for growth. Explain the WHY behind each suggestion — the strategic or technical reason that pattern matters in pickleball. Give clear, actionable next steps the player can practice this week. Respond in 150-200 words. Plain text only. No markdown, no headings, no bullet points, no asterisks.",
};

const DEFAULT_COACH = "mentor";

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtCounts(counts: Record<string, number> | undefined): string {
  if (!counts) return "(none)";
  const lines = Object.entries(counts)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([k, v]) => `- ${k}: ${v}`);
  return lines.length > 0 ? lines.join("\n") : "(none recorded)";
}

function totalOf(counts: Record<string, number> | undefined): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
}

function buildUserPrompt(body: {
  ueData?: Record<string, number>;
  feData?: Record<string, number>;
  winData?: Record<string, number>;
  notes?: string;
}): string {
  const ueTotal      = totalOf(body.ueData);
  const feTotal      = totalOf(body.feData);
  const totalErrors  = ueTotal + feTotal;
  const winnersTotal = totalOf(body.winData);
  const ratio =
    totalErrors === 0 && winnersTotal === 0
      ? "—"
      : totalErrors === 0
        ? `${winnersTotal} : 0`
        : `${(winnersTotal / totalErrors).toFixed(2)} : 1`;

  const notes = (body.notes ?? "").trim();

  return `A player just finished tallying their pickleball match film. Here is their data:

UNFORCED ERRORS (player mistakes, not forced by opponent):
${fmtCounts(body.ueData)}

FORCED ERRORS (opponent pressure caused these):
${fmtCounts(body.feData)}

WINNERS & ATTACKING SHOTS:
${fmtCounts(body.winData)}

SUMMARY:
- Unforced errors: ${ueTotal}
- Forced errors: ${feTotal}
- Total errors: ${totalErrors}
- Total winners: ${winnersTotal}
- Winners-to-errors ratio: ${ratio}

${notes ? `PLAYER NOTES:\n"${notes}"` : "PLAYER NOTES: (none)"}

Give your feedback now, in your assigned coaching voice. Stay in 150-200 words. Plain text only — no markdown, no headings, no bullet points, no asterisks.`;
}

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Server is missing ANTHROPIC_API_KEY.", { status: 500 });
  }

  let body: {
    ueData?: Record<string, number>;
    feData?: Record<string, number>;
    winData?: Record<string, number>;
    notes?: string;
    coach?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON in request body.", { status: 400 });
  }

  const coachId      = typeof body.coach === "string" && COACH_PROMPTS[body.coach] ? body.coach : DEFAULT_COACH;
  const systemPrompt = COACH_PROMPTS[coachId];
  const userPrompt   = buildUserPrompt(body);

  // ── Call Anthropic with streaming ─────────────────────────────────────────
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      stream: true,
    }),
  });

  if (!anthropicRes.ok || !anthropicRes.body) {
    const text = await anthropicRes.text().catch(() => "");
    return new Response(`Anthropic API error: ${anthropicRes.status} ${text}`.trim(), {
      status: 502,
    });
  }

  // ── Proxy the SSE stream as plain text (extract text deltas only) ─────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader  = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer    = "";

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Split on SSE event boundary (\n\n) and keep the trailing partial.
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            const json = dataLine.slice(6).trim();
            if (!json) continue;
            try {
              const parsed = JSON.parse(json);
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.type === "text_delta" &&
                typeof parsed.delta.text === "string"
              ) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // skip malformed event
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
