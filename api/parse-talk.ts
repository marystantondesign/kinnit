import Anthropic from "@anthropic-ai/sdk";
import { MAX_TRANSCRIPT_CHARS, type ParseTalkResponse } from "../src/shared/talk";
import { ParseTalkRequestSchema, parseTalk } from "../src/server/parseTalk";

// Vercel Function: POST /api/parse-talk
// Reads ANTHROPIC_API_KEY from the environment; the key never reaches the browser.

function json(body: ParseTalkResponse, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const req = ParseTalkRequestSchema.safeParse(body);
  if (!req.success) return json({ ok: false, error: "bad_request" }, 400);
  if (req.data.transcript.length > MAX_TRANSCRIPT_CHARS) {
    return json({ ok: false, error: "transcript_too_long" }, 413);
  }

  try {
    const result = await parseTalk(req.data, new Anthropic());
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ ok: false, error: "rate_limited" }, 429);
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return json({ ok: false, error: "upstream_error" }, 502);
    }
    console.error("parse-talk failed:", error);
    return json({ ok: false, error: "server_error" }, 500);
  }
}
