import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  buildSystemPrompt,
  getAnthropic,
  GREG_AI_MODEL,
} from "~/utils/anthropic.server";
import { getUserId } from "~/utils/auth.prisma";
import {
  appendMessage,
  createSession,
  getRecentHistoryForLLM,
  ownsSession,
} from "~/utils/gregChat.prisma";
import { applyRateLimit } from "~/utils/ratelimit.server";

interface ChatRequestBody {
  message?: unknown;
  sessionId?: unknown;
  locale?: unknown;
  routeContext?: unknown;
}

const MAX_MESSAGE_LENGTH = 4000;

export async function action({ request }: ActionFunctionArgs) {
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

  const locale = body.locale === "en" ? "en" : "el";
  const routeContext =
    typeof body.routeContext === "string" && body.routeContext.length < 200
      ? body.routeContext
      : undefined;

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

  await appendMessage(sessionId, "user", message);
  const history = await getRecentHistoryForLLM(sessionId);

  const anthropic = getAnthropic();
  const systemPrompt = buildSystemPrompt(locale, routeContext);

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
      try {
        // No cache_control: Haiku 4.5's minimum cacheable prefix is 4096 tokens
        // and the system prompt is well under that, so a breakpoint here is a
        // no-op. No `thinking`: Haiku 4.5 does not support adaptive thinking,
        // and omitting the field runs without thinking.
        const llmStream = anthropic.messages.stream({
          model: GREG_AI_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: history,
        });

        llmStream.on("text", (delta) => {
          assistantText += delta;
          send("delta", { text: delta });
        });

        const finalMessage = await llmStream.finalMessage();

        if (assistantText.length === 0) {
          for (const block of finalMessage.content) {
            if (block.type === "text") assistantText += block.text;
          }
        }

        if (assistantText.length > 0) {
          await appendMessage(sessionId, "assistant", assistantText);
        }

        send("done", {
          stopReason: finalMessage.stop_reason,
          usage: {
            input: finalMessage.usage.input_tokens,
            output: finalMessage.usage.output_tokens,
            cacheRead: finalMessage.usage.cache_read_input_tokens ?? 0,
            cacheCreate: finalMessage.usage.cache_creation_input_tokens ?? 0,
          },
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
