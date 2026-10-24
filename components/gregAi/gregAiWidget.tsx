import { Link, useLocation } from "@remix-run/react";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GRADES, isGrade } from "~/utils/grades";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
  rating?: number | null; // -1 / 1 / null
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

type ChatPage = "exercise" | "training" | "book" | "qa" | "home" | "other";

interface PageContext {
  page: ChatPage;
  /** Set on an exercise page so the server can look the exercise up. */
  exerciseId?: string;
  /** Set on a training page with a problem open. */
  trainingTitle?: string;
}

/**
 * Classifies the current route for the tutor. We send a key (plus an id where
 * one exists) rather than a sentence — the server owns the wording, and the
 * exercise details are read from the database, not from the browser.
 */
function derivePageContext(pathname: string, search: string): PageContext {
  if (pathname.startsWith("/exercises/")) {
    const id = pathname.slice("/exercises/".length).split("/")[0];
    return { page: "exercise", exerciseId: id || undefined };
  }
  if (pathname.startsWith("/testYourself")) {
    const title = new URLSearchParams(search).get("searchableTitle");
    return { page: "training", trainingTitle: title || undefined };
  }
  if (pathname.startsWith("/books/")) return { page: "book" };
  if (pathname.startsWith("/qa")) return { page: "qa" };
  if (pathname === "/" || pathname === "") return { page: "home" };
  return { page: "other" };
}

// Markdown links Greg emits for exercise recommendations. Only same-site
// paths ("/exercises/…") become links — anything else (http:, javascript:,
// protocol-relative "//") stays plain text, so model output can never send
// a student off-site.
const LINK_PATTERN = /(\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g;

function renderInline(text: string, key: number): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return <span key={j}>{part}</span>;
  });
  return <span key={key}>{parts}</span>;
}

function renderMessageContent(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const boldRendered = line.split(LINK_PATTERN).map((part, j) => {
      const link = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
      if (link) {
        return (
          <Link key={j} to={link[2]} className="font-medium text-blue-600 underline hover:text-blue-800">
            {link[1]}
          </Link>
        );
      }
      return renderInline(part, j);
    });
    return (
      <span key={i}>
        {boldRendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

type ContactKind = "help" | "lesson";

/** Mirrors ContactInfo in app/utils/contactInfo.server.ts. */
interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string | null;
  bookingUrl: string | null;
}

// Greg ends a reply with "[[contact:help]]" to offer the contact card (see
// CONTACT_CARD_MARKER_PATTERN in anthropic.server.ts).
const CONTACT_MARKER = /\[\[contact:(help|lesson)\]\]/g;
// A marker still arriving mid-stream ("[[cont") shouldn't flash on screen.
const PARTIAL_MARKER = /\[\[[a-z:]*\]?$/;

function splitContactCards(content: string): { text: string; cards: ContactKind[] } {
  const kinds = Array.from(content.matchAll(CONTACT_MARKER), (m) => m[1] as ContactKind);
  return {
    text: content.replace(CONTACT_MARKER, "").replace(PARTIAL_MARKER, "").trimEnd(),
    cards: Array.from(new Set(kinds)),
  };
}

const starterChip =
  "rounded-full border border-orange-300 bg-white px-3 py-1 text-xs text-orange-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300";

const cardButton =
  "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300";
const cardPrimary = "bg-orange-500 text-white hover:bg-orange-600";
const cardSecondary = "border border-orange-300 bg-white text-orange-700 hover:bg-orange-100";

interface ContactCardProps {
  kind: ContactKind;
  sessionId: string | null;
  contact: ContactInfo;
}

type HandoffStatus = "idle" | "writing" | "sending" | "sent" | "error" | "limited";

/**
 * Ways to reach Greg (the human). Nothing leaves the browser until the
 * student clicks "send" — the AI can only show this card, not use it.
 */
function ContactCard({ kind, sessionId, contact }: ContactCardProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<HandoffStatus>("idle");
  const [note, setNote] = useState("");

  async function sendToTeacher() {
    if (!sessionId) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/greg-ai/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, note }),
      });
      if (res.status === 429) {
        setStatus("limited");
        return;
      }
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  // Lesson cards lead with booking; help cards lead with "send to Greg".
  const sendStyle = kind === "help" || !contact.bookingUrl ? cardPrimary : cardSecondary;
  const bookButton = contact.bookingUrl && (
    <a
      href={contact.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cardButton} ${kind === "lesson" ? cardPrimary : cardSecondary}`}
    >
      📅 {t("gregAi.contact.book")}
    </a>
  );

  let sendBlock: React.ReactNode;
  if (!sessionId) {
    // No saved conversation to forward yet — fall back to the contact form.
    sendBlock = (
      <Link to="/contact" className={`${cardButton} ${sendStyle}`}>
        ✉️ {t("gregAi.contact.write")}
      </Link>
    );
  } else if (status === "sent") {
    sendBlock = (
      <p role="status" className="rounded-lg bg-green-100 px-3 py-2 text-xs text-green-800">
        ✅ {t("gregAi.contact.sent")}
      </p>
    );
  } else if (status === "idle") {
    sendBlock = (
      <button type="button" onClick={() => setStatus("writing")} className={`${cardButton} ${sendStyle}`}>
        ✉️ {t("gregAi.contact.send")}
      </button>
    );
  } else {
    const noteId = `greg-handoff-note-${sessionId}`;
    sendBlock = (
      <div className="flex flex-col gap-2">
        <label htmlFor={noteId} className="text-xs text-gray-700">
          {t("gregAi.contact.noteLabel")}
        </label>
        <textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={t("gregAi.contact.notePlaceholder")}
          className="resize-none rounded-lg border border-gray-300 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        />
        {(status === "error" || status === "limited") && (
          <p role="alert" className="text-xs text-red-700">
            {t(status === "limited" ? "gregAi.contact.limited" : "gregAi.contact.error")}
          </p>
        )}
        <button
          type="button"
          onClick={sendToTeacher}
          disabled={status === "sending"}
          className={`${cardButton} ${cardPrimary} disabled:opacity-50`}
        >
          {status === "sending" ? t("gregAi.contact.sending") : t("gregAi.contact.confirmSend")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="text-sm font-semibold text-gray-800">
        {kind === "lesson" ? t("gregAi.contact.lessonTitle") : t("gregAi.contact.helpTitle")}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {kind === "lesson" && bookButton}
        {sendBlock}
        {kind === "help" && bookButton}
        <div className="flex gap-2">
          <a
            href={`tel:${contact.phone}`}
            className={`${cardButton} flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
          >
            📞 {t("gregAi.contact.call")}
          </a>
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cardButton} flex-1 border border-green-300 bg-white text-green-700 hover:bg-green-50`}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface GregAiWidgetProps {
  isLoggedIn: boolean;
  contact: ContactInfo;
  /** The student's saved school grade, if they've picked one. */
  grade: string | null;
}

export default function GregAiWidget({ isLoggedIn, contact, grade: savedGrade }: GregAiWidgetProps) {
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
  const [limitReached, setLimitReached] = useState(false);
  // How far down the hint ladder this conversation is (0 = no hint yet).
  const [hintDepth, setHintDepth] = useState(0);
  const [grade, setGrade] = useState<string | null>(savedGrade);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const locale = (i18n.language?.startsWith("en") ? "en" : "el") as "el" | "en";
  const pageContext = useMemo(
    () => derivePageContext(location.pathname, location.search),
    [location.pathname, location.search]
  );

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
          rating: (m as { rating?: number | null }).rating ?? null,
        }))
      );
      setSessionId(id);
      setShowHistory(false);
      setLimitReached(false);
      setHintDepth(0);
    } catch {
      setError(t("gregAi.errorLoad"));
    }
  }

  async function rateMessage(messageId: string, rating: 1 | -1) {
    let previous: number | null = null;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        previous = m.rating ?? null;
        return { ...m, rating: m.rating === rating ? null : rating };
      })
    );
    try {
      const res = await fetch("/api/greg-ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { rating?: number | null };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, rating: data.rating ?? null } : m
        )
      );
    } catch {
      // revert optimistic change on failure
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, rating: previous } : m))
      );
    }
  }

  function startNewChat() {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
    setError(null);
    setLimitReached(false);
    setHintDepth(0);
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
    setInput("");
    await sendText(text);
  }

  /**
   * Hint ladder. The button's text is itself the request ("Give me a small
   * hint"), so it costs no more than the student typing it.
   */
  async function sendHint(level: 1 | 2 | 3) {
    if (streaming) return;
    setHintDepth((d) => Math.max(d, level));
    await sendText(t(`gregAi.hint.level${level}`), level);
  }

  async function sendText(text: string, hint?: 1 | 2 | 3) {
    setError(null);

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
          page: pageContext.page,
          exerciseId: pageContext.exerciseId,
          trainingTitle: pageContext.trainingTitle,
          hint,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        // Read from a CLONE so the original res.body stays unconsumed for the
        // existing `if (!res.ok || !res.body)` block below (burst 429s fall through).
        const body = (await res.clone().json().catch(() => ({}))) as {
          error?: string;
        };
        if (body.error === "daily_limit_reached") {
          setLimitReached(true);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, pending: false, content: t("gregAi.limitReached") }
                : m
            )
          );
          setStreaming(false);
          abortRef.current = null;
          return;
        }
      }

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
            const doneId =
              typeof parsed.messageId === "string" ? parsed.messageId : null;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, pending: false, id: doneId ?? m.id }
                  : m
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

  /** Starter that puts the beginning of a question in the box to finish. */
  function prefillInput(text: string) {
    setInput(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  }

  /** Shows the contact card straight away — no AI call, no quota used. */
  function showContactCard(kind: ContactKind) {
    const intro = t(kind === "lesson" ? "gregAi.contact.lessonIntro" : "gregAi.contact.helpIntro");
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "assistant", content: `${intro}\n\n[[contact:${kind}]]` },
    ]);
  }

  /** Saved once, then Greg pitches explanations at this level. */
  async function saveGrade(value: string) {
    if (!isGrade(value)) return;
    setGrade(value);
    try {
      const res = await fetch("/api/greg-ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setGrade(null);
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
                      onClick={() => {
                        setShowHistory(false);
                        showContactCard("help");
                      }}
                      aria-label={t("gregAi.contactAria")}
                      title={t("gregAi.contactAria")}
                      className="rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
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
                  <>
                    <div className="rounded-lg bg-white p-3 text-sm text-gray-700 shadow-sm">
                      {t("gregAi.welcome")}
                    </div>
                    {!grade && (
                      <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-700 shadow-sm">
                        <label htmlFor="greg-ai-grade" className="block text-xs font-semibold">
                          🎓 {t("gregAi.grade.question")}
                        </label>
                        <select
                          id="greg-ai-grade"
                          defaultValue=""
                          onChange={(e) => saveGrade(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                          <option value="" disabled>
                            {t("gregAi.grade.choose")}
                          </option>
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {t(`gregAi.grade.${g}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pageContext.page === "exercise" && (
                        <button type="button" onClick={() => prefillInput(t("gregAi.starters.thisExerciseText"))} className={starterChip}>
                          {t("gregAi.starters.thisExercise")}
                        </button>
                      )}
                      <button type="button" onClick={() => prefillInput(t("gregAi.starters.explainText"))} className={starterChip}>
                        {t("gregAi.starters.explain")}
                      </button>
                      <button type="button" onClick={() => prefillInput(t("gregAi.starters.practiceText"))} className={starterChip}>
                        {t("gregAi.starters.practice")}
                      </button>
                      <button type="button" onClick={() => showContactCard("help")} className={starterChip}>
                        {t("gregAi.starters.teacher")}
                      </button>
                      <button type="button" onClick={() => showContactCard("lesson")} className={starterChip}>
                        {t("gregAi.starters.lessons")}
                      </button>
                    </div>
                  </>
                )}
                <ul className="mt-2 space-y-3">
                  {messages.map((m) => {
                    const { text: bodyText, cards } =
                      m.role === "assistant"
                        ? splitContactCards(m.content)
                        : { text: m.content, cards: [] as ContactKind[] };
                    return (
                    <li
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[85%] flex-col ${
                          m.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            m.role === "user"
                              ? "bg-orange-500 text-white"
                              : "bg-white text-gray-800"
                          }`}
                        >
                          {m.role === "assistant" ? (
                            <MathJax dynamic>
                              {renderMessageContent(bodyText || (m.pending ? "…" : ""))}
                            </MathJax>
                          ) : (
                            renderMessageContent(m.content)
                          )}
                        </div>
                        {!m.pending &&
                          cards.map((kind, i) => (
                            <ContactCard key={i} kind={kind} sessionId={sessionId} contact={contact} />
                          ))}
                        {m.role === "assistant" &&
                          !m.pending &&
                          !m.id.startsWith("local-") && (
                            <div className="mt-1 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => rateMessage(m.id, 1)}
                                aria-label={t("gregAi.thumbsUpAria")}
                                aria-pressed={m.rating === 1}
                                className={`rounded p-1 text-xs transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                                  m.rating === 1 ? "text-orange-600" : "text-gray-400"
                                }`}
                              >
                                👍
                              </button>
                              <button
                                type="button"
                                onClick={() => rateMessage(m.id, -1)}
                                aria-label={t("gregAi.thumbsDownAria")}
                                aria-pressed={m.rating === -1}
                                className={`rounded p-1 text-xs transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                                  m.rating === -1 ? "text-orange-600" : "text-gray-400"
                                }`}
                              >
                                👎
                              </button>
                            </div>
                          )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {isLoggedIn && !showHistory && messages.length > 0 && !streaming && !limitReached && (
              <div className="flex flex-wrap gap-2 border-t border-gray-200 bg-white px-2 pt-2">
                <button type="button" onClick={() => sendHint(hintDepth === 0 ? 1 : 2)} className={starterChip}>
                  {t(hintDepth === 0 ? "gregAi.hint.button1" : "gregAi.hint.button2")}
                </button>
                {hintDepth > 0 && (
                  <button type="button" onClick={() => sendHint(3)} className={starterChip}>
                    {t("gregAi.hint.button3")}
                  </button>
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
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder={
                      limitReached
                        ? t("gregAi.limitReached")
                        : t("gregAi.placeholder")
                    }
                    rows={1}
                    disabled={streaming || limitReached}
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
                      disabled={!input.trim() || limitReached}
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
