import { Link } from "@remix-run/react";
import { MathJax } from "better-react-mathjax";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { renderMessageContent } from "./messageContent";

interface PracticeProblem {
  id: string;
  exerciseId: string;
  order: number;
  section: string | null;
  label: string;
  topic: string;
  statement: string;
  bookletTitle: string;
}

type Verdict = "correct" | "partial" | "incorrect";

const VERDICT_STYLE: Record<Verdict, string> = {
  correct: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  incorrect: "bg-red-100 text-red-800",
};

// Problems already shown this visit, so "next" doesn't repeat them.
const MAX_SEEN = 50;

interface PracticePanelProps {
  locale: "el" | "en";
  /** Hands the problem to the chat on its booklet's page. */
  onAskGreg: (problem: { exerciseId: string; order: number }) => void;
}

/**
 * Practice mode: real problems from the library. Fetching one is a database
 * lookup (no tokens); only "check my answer" calls the model, once.
 */
export default function PracticePanel({ locale, onAskGreg }: PracticePanelProps) {
  const { t } = useTranslation();
  const [topic, setTopic] = useState("");
  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ verdict: Verdict; feedback: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "checking">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function nextProblem() {
    setStatus("loading");
    setMessage(null);
    setResult(null);
    setAnswer("");
    try {
      const params = new URLSearchParams({ q: topic.trim(), exclude: seen.join(",") });
      const res = await fetch(`/api/greg-ai/practice?${params}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { problem: PracticeProblem | null };
      setProblem(data.problem);
      if (data.problem) {
        const id = data.problem.id;
        setSeen((prev) => [...prev, id].slice(-MAX_SEEN));
      } else {
        setMessage(t(seen.length ? "gregAi.practice.noMore" : "gregAi.practice.none"));
      }
    } catch {
      setMessage(t("gregAi.practice.error"));
    } finally {
      setStatus("idle");
    }
  }

  async function checkAnswer() {
    if (!problem || !answer.trim()) return;
    setStatus("checking");
    setMessage(null);
    try {
      const res = await fetch("/api/greg-ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: problem.id, answer, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        verdict?: Verdict;
        feedback?: string;
        error?: string;
      };
      if (res.status === 429 && data.error === "daily_limit_reached") {
        setMessage(t("gregAi.limitReached"));
      } else if (!res.ok || !data.verdict) {
        setMessage(t("gregAi.practice.error"));
      } else {
        setResult({ verdict: data.verdict, feedback: data.feedback ?? "" });
      }
    } catch {
      setMessage(t("gregAi.practice.error"));
    } finally {
      setStatus("idle");
    }
  }

  const busy = status !== "idle";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-3 text-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSeen([]);
          nextProblem();
        }}
        className="flex gap-2"
      >
        <label htmlFor="greg-practice-topic" className="sr-only">
          {t("gregAi.practice.topicLabel")}
        </label>
        <input
          id="greg-practice-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t("gregAi.practice.topicPlaceholder")}
          maxLength={100}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {t("gregAi.practice.start")}
        </button>
      </form>

      {!problem && !message && (
        <p className="mt-3 text-xs text-gray-500">{t("gregAi.practice.intro")}</p>
      )}

      {problem && (
        <div className="mt-3 rounded-xl bg-white p-3 shadow-sm">
          <div className="text-xs text-gray-500">
            <Link to={`/exercises/${problem.exerciseId}`} className="font-medium text-blue-600 underline">
              {problem.bookletTitle}
            </Link>
            {" · "}
            {[problem.section, problem.label].filter(Boolean).join(" — ")}
          </div>
          <div className="mt-2 text-gray-800">
            <MathJax dynamic>{renderMessageContent(problem.statement)}</MathJax>
          </div>

          {!result && (
            <>
              <label htmlFor="greg-practice-answer" className="mt-3 block text-xs font-semibold text-gray-700">
                {t("gregAi.practice.answerLabel")}
              </label>
              <textarea
                id="greg-practice-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("gregAi.practice.answerPlaceholder")}
                className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              />
              <button
                type="button"
                onClick={checkAnswer}
                disabled={busy || !answer.trim()}
                className="mt-2 w-full rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {status === "checking" ? t("gregAi.practice.checking") : t("gregAi.practice.check")}
              </button>
            </>
          )}

          {result && (
            <div role="status" className={`mt-3 rounded-lg px-3 py-2 text-xs ${VERDICT_STYLE[result.verdict]}`}>
              <div className="font-semibold">{t(`gregAi.practice.verdict.${result.verdict}`)}</div>
              <MathJax dynamic>{renderMessageContent(result.feedback)}</MathJax>
            </div>
          )}

          <div className="mt-2 flex gap-2">
            {result && result.verdict !== "correct" && (
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 rounded-lg border border-orange-300 bg-white px-2 py-1 text-xs text-orange-700 hover:bg-orange-50"
              >
                {t("gregAi.practice.tryAgain")}
              </button>
            )}
            <button
              type="button"
              onClick={() => onAskGreg({ exerciseId: problem.exerciseId, order: problem.order })}
              className="flex-1 rounded-lg border border-orange-300 bg-white px-2 py-1 text-xs text-orange-700 hover:bg-orange-50"
            >
              {t("gregAi.practice.askGreg")}
            </button>
            <button
              type="button"
              onClick={nextProblem}
              disabled={busy}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {t("gregAi.practice.next")}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="mt-3 rounded-lg bg-white p-3 text-xs text-gray-700 shadow-sm">
          {message}
        </p>
      )}
    </div>
  );
}
