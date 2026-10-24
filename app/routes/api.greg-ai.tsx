import type Anthropic from "@anthropic-ai/sdk";
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { ChatContext, TokenUsage } from "~/utils/anthropic.server";
import {
  buildSystemPrompt,
  formatExerciseItem,
  GET_EXERCISE_TOOL,
  getAnthropic,
  GREG_AI_MODEL,
  isChatPage,
  isHintLevel,
  MAX_OUTPUT_TOKENS,
  MAX_TOOL_ROUNDS,
  SEARCH_EXERCISES_TOOL,
} from "~/utils/anthropic.server";
import { getUserId } from "~/utils/auth.prisma";
import {
  getExerciseContextById,
  getExerciseItem,
  getExerciseItemById,
  getExerciseItemIndex,
  searchExercisesForGreg,
} from "~/utils/exersices.prisma";
import { isGregAiEnabled } from "~/utils/featureFlags.server";
import { GRADE_PROMPT_LABEL, isGrade } from "~/utils/grades";
import {
  appendMessage,
  createSession,
  getActiveItemId,
  getRecentStruggles,
  getRecentHistoryForLLM,
  incrementDailyUsage,
  ownsSession,
  recordTokenUsage,
  setActiveItemId,
} from "~/utils/gregChat.prisma";
import { getLocalizedContent } from "~/utils/i18n.server";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { getTrainingContextByTitle } from "~/utils/training.prisma";
import { searchVideosForGreg } from "~/utils/video.prisma";

interface ChatRequestBody {
  message?: unknown;
  sessionId?: unknown;
  locale?: unknown;
  /** Which kind of page the widget is open on — one of CHAT_PAGES. */
  page?: unknown;
  /** Exercise id, when `page` is "exercise". Resolved server-side. */
  exerciseId?: unknown;
  /** Training searchableTitle, when `page` is "training". Resolved server-side. */
  trainingTitle?: unknown;
  /** Which hint button sent this message (1–3), for the teacher dashboard. */
  hint?: unknown;
}

const MAX_TRAINING_TITLE_LENGTH = 200;

function trainingTitleOf(body: ChatRequestBody): string | null {
  return typeof body.trainingTitle === "string" &&
    body.trainingTitle.length > 0 &&
    body.trainingTitle.length <= MAX_TRAINING_TITLE_LENGTH
    ? body.trainingTitle
    : null;
}

/**
 * Builds the tutor's situational context from the request. Everything that
 * reaches the system prompt is either a server-side constant (the page phrase)
 * or admin-authored database content (the exercise fields) — the browser only
 * ever supplies keys and ids, never prose.
 */
async function resolveChatContext(
  body: ChatRequestBody,
  locale: "el" | "en",
  activeItemId: string | null
): Promise<{ context: ChatContext; bookletId: string | null }> {
  const page = isChatPage(body.page) ? body.page : "other";

  const trainingTitle = page === "training" ? trainingTitleOf(body) : null;
  if (trainingTitle) {
    const training = await getTrainingContextByTitle(trainingTitle, locale);
    return { context: { page, training }, bookletId: null };
  }

  if (page !== "exercise" || typeof body.exerciseId !== "string") {
    return { context: { page }, bookletId: null };
  }

  const exercise = await getExerciseContextById(body.exerciseId);
  if (!exercise) return { context: { page }, bookletId: null };
  const bookletId = body.exerciseId;

  const localized = getLocalizedContent(
    exercise as unknown as Parameters<typeof getLocalizedContent>[0],
    locale
  ) as unknown as typeof exercise;

  // Items made from a since-replaced PDF describe different problems — worse
  // than none. Same key scheme as exerciseSourceKey(), but without selecting
  // the (multi-MB) legacy file column to compute it.
  const currentSource = exercise.cloudinaryPublicId
    ? `cloudinary:${exercise.cloudinaryPublicId}`
    : "legacy";
  const transcriptIsCurrent = exercise.gregSource === currentSource;

  const [index, activeItem] = transcriptIsCurrent
    ? await Promise.all([
        getExerciseItemIndex(bookletId),
        // Scoped to this booklet: a conversation that moves to another page
        // simply drops the old problem.
        activeItemId ? getExerciseItemById(bookletId, activeItemId) : null,
      ])
    : [[], null];

  return {
    bookletId: transcriptIsCurrent ? bookletId : null,
    context: {
      page,
      exercise: {
        title: localized.title,
        description: localized.description,
        category: localized.category,
        level: localized.level,
        tags: localized.tags,
        index,
        activeItem,
      },
    },
  };
}

/**
 * Runs a `search_exercises` call. Results go back to the model as JSON and
 * never include solutions — only a problem opened with get_exercise gets
 * that, under the never-reveal instruction.
 */
async function runSearchExercises(input: unknown): Promise<string> {
  const query =
    input && typeof input === "object" && "query" in input && typeof input.query === "string"
      ? input.query.slice(0, 100)
      : "";
  const [results, videos] = await Promise.all([
    searchExercisesForGreg(query),
    searchVideosForGreg(query),
  ]);
  if (results.length === 0 && videos.length === 0) {
    return JSON.stringify({ results: [], note: "Nothing matched. Try a broader or different Greek keyword." });
  }
  return JSON.stringify({
    videos: videos.map((video) => ({
      title: video.title,
      category: video.category,
      link: `/videos?video=${video.id}`,
    })),
    results: results.map((item) => ({
      booklet: item.booklet?.title ?? null,
      category: item.booklet?.category ?? null,
      level: item.booklet?.level ?? null,
      link: `/exercises/${item.exerciseId}`,
      problem: [item.section, item.label].filter(Boolean).join(" — "),
      topic: item.topic,
      excerpt: item.statement.slice(0, 300),
    })),
  });
}

/**
 * Runs a `get_exercise` call against the booklet on the current page (never
 * one the model names) and remembers the problem for later turns.
 */
async function runGetExercise(
  input: unknown,
  bookletId: string | null,
  sessionId: string,
  locale: "el" | "en"
): Promise<{ content: string; isError: boolean }> {
  if (!bookletId) {
    return { content: "No transcribed booklet is open on this page.", isError: true };
  }
  const number =
    input && typeof input === "object" && "number" in input && typeof input.number === "number"
      ? input.number
      : NaN;
  const item = Number.isInteger(number) ? await getExerciseItem(bookletId, number) : null;
  if (!item) {
    return { content: `There is no problem #${number} in this booklet.`, isError: true };
  }
  await setActiveItemId(sessionId, item.id);
  return { content: formatExerciseItem(item, locale), isError: false };
}

const MAX_MESSAGE_LENGTH = 4000;

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

  const rateLimitResponse = applyRateLimit(request, "chat", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return json({ error: "Message required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: "Message too long" }, { status: 400 });
  }

  // Daily quota (Mongo-persisted so it survives serverless cold starts). Runs
  // after the in-memory burst limiter and message validation, before session
  // handling, so malformed/empty requests don't consume quota. Error code only;
  // the widget localizes the "come back tomorrow" message.
  const usage = await incrementDailyUsage(userId);
  if (usage.limitReached) {
    // One error code for both ceilings — to the student "message limit" and
    // "spend budget" mean the same thing (come back tomorrow), and the widget
    // already localizes it. `reason` is for logs and the admin view.
    return json(
      { error: "daily_limit_reached", reason: usage.reason },
      { status: 429 }
    );
  }

  const locale = body.locale === "en" ? "en" : "el";

  let sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

  if (sessionId) {
    const owns = await ownsSession(sessionId, userId);
    if (!owns) {
      return json({ error: "Session not found" }, { status: 404 });
    }
  } else {
    const newSession = await createSession(userId, message, locale);
    sessionId = newSession.id;
  }

  const page = isChatPage(body.page) ? body.page : "other";
  await appendMessage(sessionId, "user", message, {
    hintLevel: isHintLevel(body.hint) ? body.hint : null,
    page,
    contextKey:
      page === "exercise" && typeof body.exerciseId === "string"
        ? body.exerciseId.slice(0, 24)
        : page === "training"
          ? trainingTitleOf(body)
          : null,
  });
  const [history, activeItemId, student, struggles] = await Promise.all([
    getRecentHistoryForLLM(sessionId),
    getActiveItemId(sessionId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true, profile: { select: { firstName: true } } },
    }),
    getRecentStruggles(userId),
  ]);
  const { context: chatContext, bookletId } = await resolveChatContext(
    body,
    locale,
    activeItemId
  );
  chatContext.student = {
    firstName: student?.profile?.firstName || null,
    grade: isGrade(student?.grade) ? GRADE_PROMPT_LABEL[student.grade][locale] : null,
    struggles,
  };

  const anthropic = getAnthropic();
  const systemPrompt = buildSystemPrompt(locale, chatContext);
  // get_exercise only makes sense with a transcribed booklet on screen.
  const tools: Anthropic.Tool[] = bookletId
    ? [GET_EXERCISE_TOOL, SEARCH_EXERCISES_TOOL]
    : [SEARCH_EXERCISES_TOOL];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("session", { sessionId });

      let assistantText = "";
      const tokenUsage: TokenUsage = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
      try {
        // Tool loop: Greg may call a tool, then answer. Text from
        // every round streams to the widget as one reply; only that text is
        // stored — tool calls are per-turn plumbing, not chat history.
        //
        // No cache_control: Haiku 4.5's minimum cacheable prefix is 4096
        // tokens and the prompt is usually under that, so a breakpoint is a
        // no-op. No `thinking`: Haiku 4.5 does not support adaptive thinking,
        // and omitting the field runs without thinking.
        const messages: Anthropic.MessageParam[] = [...history];
        let finalMessage: Anthropic.Message | undefined;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const isLastRound = round === MAX_TOOL_ROUNDS - 1;
          const llmStream = anthropic.messages.stream({
            model: GREG_AI_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: systemPrompt,
            tools,
            // Last round must produce an answer, not another tool call.
            tool_choice: isLastRound ? { type: "none" } : { type: "auto" },
            messages,
          });

          llmStream.on("text", (delta) => {
            assistantText += delta;
            send("delta", { text: delta });
          });

          finalMessage = await llmStream.finalMessage();
          tokenUsage.input += finalMessage.usage.input_tokens;
          tokenUsage.output += finalMessage.usage.output_tokens;
          tokenUsage.cacheRead += finalMessage.usage.cache_read_input_tokens ?? 0;
          tokenUsage.cacheCreate += finalMessage.usage.cache_creation_input_tokens ?? 0;

          if (finalMessage.stop_reason !== "tool_use") break;

          const toolUses = finalMessage.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          messages.push({ role: "assistant", content: finalMessage.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUses) {
            try {
              if (toolUse.name === SEARCH_EXERCISES_TOOL.name) {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  content: await runSearchExercises(toolUse.input),
                });
              } else if (toolUse.name === GET_EXERCISE_TOOL.name) {
                const result = await runGetExercise(toolUse.input, bookletId, sessionId, locale);
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  is_error: result.isError,
                  content: result.content,
                });
              } else {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  is_error: true,
                  content: `Unknown tool: ${toolUse.name}`,
                });
              }
            } catch (toolErr) {
              console.error(`[greg-ai] ${toolUse.name} failed:`, toolErr);
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                is_error: true,
                content: "This tool is temporarily unavailable.",
              });
            }
          }
          messages.push({ role: "user", content: toolResults });

          // Keep rounds visually separate in the widget ("Let me look…" then
          // the results) without a run-on sentence.
          if (assistantText.length > 0 && !assistantText.endsWith("\n")) {
            assistantText += "\n\n";
            send("delta", { text: "\n\n" });
          }
        }

        let assistantMessageId: string | null = null;
        if (assistantText.trim().length > 0) {
          const saved = await appendMessage(sessionId, "assistant", assistantText.trim());
          assistantMessageId = saved.id;
        }

        // Bill the exchange. Never let an accounting write fail a reply the
        // student has already received — worst case we under-count one turn.
        try {
          await recordTokenUsage(userId, tokenUsage);
        } catch (usageErr) {
          console.error("[greg-ai] failed to record token usage:", usageErr);
        }

        send("done", {
          messageId: assistantMessageId,
          stopReason: finalMessage?.stop_reason ?? null,
          usage: tokenUsage,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error from Anthropic";
        console.error("[greg-ai] stream error:", message);
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
