import { Link, useLocation } from "@remix-run/react";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
}

interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

const mathJaxConfig = {
  loader: { load: ["[tex]/ams"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
    packages: { "[+]": ["ams"] },
  },
};

function newId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveRouteContext(pathname: string): string {
  if (pathname.startsWith("/exercises/")) return "user is viewing an exercise";
  if (pathname.startsWith("/training/")) return "user is on a training exercise";
  if (pathname.startsWith("/books/")) return "user is browsing a book";
  if (pathname.startsWith("/qa")) return "user is in Q&A";
  if (pathname === "/" || pathname === "") return "user is on the home page";
  return `user is on ${pathname}`;
}

function renderMessageContent(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const boldRendered = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return (
      <span key={i}>
        {boldRendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

interface GregAiWidgetProps {
  isLoggedIn: boolean;
}

export default function GregAiWidget({ isLoggedIn }: GregAiWidgetProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const locale = (i18n.language?.startsWith("en") ? "en" : "el") as "el" | "en";
  const routeContext = useMemo(() => deriveRouteContext(location.pathname), [location.pathname]);

  async function loadSessions() {
    try {
      const res = await fetch("/api/greg-ai/sessions");
      if (!res.ok) return;
      const data = (await res.json()) as { sessions?: SessionSummary[] };
      setSessions(data.sessions ?? []);
    } catch {
      // ignore
    }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/greg-ai/sessions?sessionId=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: ChatMessage[] };
      setMessages(
        (data.messages ?? []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
      setSessionId(id);
      setShowHistory(false);
    } catch {
      setError(t("gregAi.errorLoad"));
    }
  }

  function startNewChat() {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
    setError(null);
  }

  async function deleteSession(id: string) {
    if (!confirm(t("gregAi.confirmDelete"))) return;
    try {
      await fetch(`/api/greg-ai/sessions?sessionId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) startNewChat();
    } catch {
      // ignore
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    setInput("");

    const userMsg: ChatMessage = { id: newId(), role: "user", content: text };
    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      pending: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/greg-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          locale,
          routeContext,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error || `HTTP ${res.status}`
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const block of events) {
          const lines = block.split("\n");
          let eventName = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventName = line.slice(7).trim();
            else if (line.startsWith("data: ")) data += line.slice(6);
          }
          if (!data) continue;
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(data) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (eventName === "session" && typeof parsed.sessionId === "string") {
            setSessionId(parsed.sessionId);
          } else if (eventName === "delta" && typeof parsed.text === "string") {
            const chunk = parsed.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + chunk }
                  : m
              )
            );
          } else if (eventName === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, pending: false } : m
              )
            );
          } else if (eventName === "error") {
            const msg = typeof parsed.message === "string" ? parsed.message : "error";
            throw new Error(msg);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg !== "BodyStreamBuffer was aborted" && msg !== "The user aborted a request.") {
        setError(msg);
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                pending: false,
                content: m.content || t("gregAi.errorReply"),
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  if (!mounted) return null;

  const showWelcome = messages.length === 0 && !streaming;

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="fixed bottom-4 right-4 z-[60]">
        {!open && (
          <button
            type="button"
            aria-label={t("gregAi.openAria")}
            onClick={() => {
              setOpen(true);
              if (isLoggedIn) loadSessions();
            }}
            className="group flex items-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-white shadow-lg transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span className="hidden text-sm font-semibold sm:inline">
              {t("gregAi.openLabel")}
            </span>
          </button>
        )}

        {open && (
          <div className="flex h-[min(70vh,640px)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                  G
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">
                    {t("gregAi.title")}
                  </div>
                  <div className="text-xs opacity-90">
                    {t("gregAi.subtitle")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isLoggedIn && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowHistory((v) => !v)}
                      aria-label={t("gregAi.historyAria")}
                      className="rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={startNewChat}
                      aria-label={t("gregAi.newChatAria")}
                      className="rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("gregAi.closeAria")}
                  className="rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
                <div className="rounded-lg bg-white p-4 text-sm text-gray-700 shadow-sm">
                  {t("gregAi.loginPrompt")}
                </div>
                <Link
                  to="/login"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                >
                  {t("gregAi.loginCta")}
                </Link>
              </div>
            ) : showHistory ? (
              <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  {t("gregAi.historyTitle")}
                </h3>
                {sessions.length === 0 ? (
                  <p className="text-xs text-gray-500">{t("gregAi.noHistory")}</p>
                ) : (
                  <ul className="space-y-1">
                    {sessions.map((s) => (
                      <li key={s.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => loadSession(s.id)}
                          className="flex-1 truncate rounded px-2 py-2 text-left text-xs text-gray-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                        >
                          {s.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSession(s.id)}
                          aria-label={t("gregAi.deleteAria")}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 p-3">
                {showWelcome && (
                  <div className="rounded-lg bg-white p-3 text-sm text-gray-700 shadow-sm">
                    {t("gregAi.welcome")}
                  </div>
                )}
                <ul className="mt-2 space-y-3">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          m.role === "user"
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <MathJax dynamic>
                            {renderMessageContent(m.content || (m.pending ? "…" : ""))}
                          </MathJax>
                        ) : (
                          renderMessageContent(m.content)
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {isLoggedIn && !showHistory && (
              <form
                onSubmit={sendMessage}
                className="border-t border-gray-200 bg-white p-2"
              >
                <div className="flex items-end gap-2">
                  <label htmlFor="greg-ai-input" className="sr-only">
                    {t("gregAi.inputLabel")}
                  </label>
                  <textarea
                    id="greg-ai-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder={t("gregAi.placeholder")}
                    rows={1}
                    disabled={streaming}
                    className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:bg-gray-100"
                  />
                  {streaming ? (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      aria-label={t("gregAi.stopAria")}
                      className="rounded-lg bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      aria-label={t("gregAi.sendAria")}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-white hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </MathJaxContext>
  );
}
