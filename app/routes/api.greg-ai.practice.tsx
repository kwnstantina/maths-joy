import type Anthropic from "@anthropic-ai/sdk";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { PracticeVerdict, TokenUsage } from "~/utils/anthropic.server";
import {
  buildPracticeCheckPrompt,
  getAnthropic,
  GRADE_ANSWER_TOOL,
  GREG_AI_MODEL,
  PRACTICE_MAX_OUTPUT_TOKENS,
  PRACTICE_VERDICTS,
} from "~/utils/anthropic.server";
import { getUserId } from "~/utils/auth.prisma";
import { requireGregConsent } from "~/utils/consent.server";
import { getPracticeItemWithSolution, getPracticeProblem } from "~/utils/exersices.prisma";
import { isGregAiEnabled } from "~/utils/featureFlags.server";
import { incrementDailyUsage, recordTokenUsage } from "~/utils/gregChat.prisma";
import { trackPracticeResult } from "~/utils/progress.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { getGregLimits } from "~/utils/subscription.server";

const MAX_EXCLUDE = 50;
const MAX_ANSWER_LENGTH = 2000;
const SCORE: Record<PracticeVerdict, number> = { correct: 100, partial: 50, incorrect: 0 };

/**
 * GET ?q=<topic>&exclude=<id,id,…> — a random practice problem from the
 * library. A database lookup only: no model call, no quota.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  if (!isGregAiEnabled()) {
    return json({ error: "Greg AI is disabled" }, { status: 404 });
  }
  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const consentResponse = await requireGregConsent(userId);
  if (consentResponse) return consentResponse;
  const rateLimitResponse = applyRateLimit(request, "api", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 100);
  const exclude = (url.searchParams.get("exclude") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, MAX_EXCLUDE);

  const problem = await getPracticeProblem(q, exclude);
  return json({ problem });
}

/**
 * POST { itemId, answer, locale } — Greg AI checks the answer against the
 * official solution in one forced tool call. Counts toward the daily quota.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (!isGregAiEnabled()) {
    return json({ error: "Greg AI is disabled" }, { status: 404 });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const consentResponse = await requireGregConsent(userId);
  if (consentResponse) return consentResponse;
  const rateLimitResponse = applyRateLimit(request, "chat", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: { itemId?: unknown; answer?: unknown; locale?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (!answer || answer.length > MAX_ANSWER_LENGTH) {
    return json({ error: "Invalid answer" }, { status: 400 });
  }
  const item =
    typeof body.itemId === "string" ? await getPracticeItemWithSolution(body.itemId) : null;
  if (!item?.solution) {
    return json({ error: "Problem not found" }, { status: 404 });
  }

  const limits = await getGregLimits(userId);
  const usage = await incrementDailyUsage(userId, limits);
  if (usage.limitReached) {
    return json(
      { error: "daily_limit_reached", reason: usage.reason, plan: limits.plan },
      { status: 429 }
    );
  }

  const locale = body.locale === "en" ? "en" : "el";
  let message: Anthropic.Message;
  try {
    message = await getAnthropic().messages.create({
      model: GREG_AI_MODEL,
      max_tokens: PRACTICE_MAX_OUTPUT_TOKENS,
      system: buildPracticeCheckPrompt(locale),
      tools: [GRADE_ANSWER_TOOL],
      tool_choice: { type: "tool", name: GRADE_ANSWER_TOOL.name },
      messages: [
        {
          role: "user",
          content: `<problem>\n${item.statement}\n</problem>\n\n<official_solution>\n${item.solution}\n</official_solution>\n\n<student_answer>\n${answer}\n</student_answer>`,
        },
      ],
    });
  } catch (err) {
    console.error("[greg-ai] practice check failed:", err);
    return json({ error: "check_failed" }, { status: 502 });
  }

  const tokenUsage: TokenUsage = {
    input: message.usage.input_tokens,
    output: message.usage.output_tokens,
    cacheRead: message.usage.cache_read_input_tokens ?? 0,
    cacheCreate: message.usage.cache_creation_input_tokens ?? 0,
  };
  try {
    await recordTokenUsage(userId, tokenUsage);
  } catch (usageErr) {
    console.error("[greg-ai] failed to record practice token usage:", usageErr);
  }

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  const input = (toolUse?.input ?? {}) as { verdict?: unknown; feedback?: unknown };
  const verdict = (PRACTICE_VERDICTS as readonly unknown[]).includes(input.verdict)
    ? (input.verdict as PracticeVerdict)
    : null;
  const feedback = typeof input.feedback === "string" ? input.feedback : "";
  if (!verdict) {
    return json({ error: "check_failed" }, { status: 502 });
  }

  try {
    await trackPracticeResult(userId, item.exerciseId, SCORE[verdict]);
  } catch (err) {
    console.error("[progress] trackPracticeResult failed:", err);
  }

  return json({ verdict, feedback });
}
