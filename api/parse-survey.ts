import Anthropic from "@anthropic-ai/sdk";
import { MAX_TRANSCRIPT_CHARS, type ParseSurveyResponse } from "../src/shared/surveyTalk";
import { ParseSurveyRequestSchema, parseSurvey } from "../src/server/parseSurvey";

// Vercel Function: POST /api/parse-survey
// Reads ANTHROPIC_API_KEY from the environment; the key never reaches the browser.

function json(body: ParseSurveyResponse, status = 200) {
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

  const req = ParseSurveyRequestSchema.safeParse(body);
  if (!req.success) return json({ ok: false, error: "bad_request" }, 400);
  if (req.data.transcript.length > MAX_TRANSCRIPT_CHARS) {
    return json({ ok: false, error: "transcript_too_long" }, 413);
  }

  try {
    const result = await parseSurvey(req.data, new Anthropic());
    return json(result, result.ok ? 200 : 422);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ ok: false, error: "rate_limited" }, 429);
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return json({ ok: false, error: "upstream_error" }, 502);
    }
    console.error("parse-survey failed:", error);
    return json({ ok: false, error: "server_error" }, 500);
  }
}
