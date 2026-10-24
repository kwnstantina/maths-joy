import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("[greg-ai] ANTHROPIC_API_KEY not set — chatbot will fail at runtime");
}

let client: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (!client) {
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const GREG_AI_MODEL = "claude-haiku-4-5";

// Cap on a single reply. Greg is a Socratic tutor — a hint plus a guiding
// question is 100-300 tokens, so 1024 leaves comfortable headroom while
// bounding the worst-case cost of any one message (output is 5x input).
export const MAX_OUTPUT_TOKENS = 1024;

// Max chat messages one user may send per UTC calendar day.
export const CHAT_DAILY_LIMIT = 50;

// Per-user daily spend ceiling, in input-token equivalents (see costUnits).
// 1_000_000 units = $1.00 at Haiku 4.5 rates, so this is ~$0.30/user/day.
// A message-count limit alone can't bound cost: one student pasting long
// problems costs an order of magnitude more than one asking "γιατί;".
export const CHAT_DAILY_SPEND_BUDGET = 300_000;

// Haiku 4.5 list prices, USD per million tokens. Cache reads are 0.1x the
// input rate and cache writes 1.25x. Normalising everything to input-token
// equivalents keeps the budget a single comparable integer.
const OUTPUT_MULTIPLIER = 5; // $5/MTok out vs $1/MTok in
const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreate: number;
}

/** Weighted cost of one exchange, in input-token equivalents. */
export function costUnits(usage: TokenUsage): number {
  return Math.round(
    usage.input +
      usage.output * OUTPUT_MULTIPLIER +
      usage.cacheRead * CACHE_READ_MULTIPLIER +
      usage.cacheCreate * CACHE_WRITE_MULTIPLIER
  );
}

// Where in the site the student is chatting from. A closed set: the client
// sends the key only, and the server maps it to text. Never interpolate a
// client-supplied string into the system prompt — that is a prompt-injection
// channel straight into the tutor's instructions.
export const CHAT_PAGES = [
  "exercise",
  "training",
  "book",
  "qa",
  "home",
  "other",
] as const;

export type ChatPage = (typeof CHAT_PAGES)[number];

export function isChatPage(value: unknown): value is ChatPage {
  return (
    typeof value === "string" && (CHAT_PAGES as readonly string[]).includes(value)
  );
}

const PAGE_CONTEXT: Record<ChatPage, string> = {
  exercise: "The student is viewing an exercise.",
  training: "The student is working through a training exercise.",
  book: "The student is browsing a book.",
  qa: "The student is in the Q&A section.",
  home: "The student is on the home page.",
  other: "The student is browsing the site.",
};

/**
 * Exercise metadata, already localized. Values come from the database (author
 * is an admin), never from the browser.
 */
export interface ExerciseContext {
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  tags?: string[];
  /**
   * Table of contents of the booklet's transcribed problems. Empty/absent
   * when the PDF hasn't been transcribed (or the transcript is stale).
   */
  index?: { order: number; section: string | null; label: string; topic: string }[];
  /** The problem the student is working on, carried over from earlier turns. */
  activeItem?: ExerciseItemText | null;
}

/** One transcribed problem, as Greg sees it. */
export interface ExerciseItemText {
  order: number;
  section: string | null;
  label: string;
  topic: string;
  statement: string;
  solution: string | null;
}

/**
 * Renders one problem for the model — used both for the active problem in
 * the system prompt and as the get_exercise tool result, so Greg sees the
 * same never-reveal framing either way.
 */
export function formatExerciseItem(item: ExerciseItemText, locale: "el" | "en"): string {
  const heading = [item.section, item.label].filter(Boolean).join(" — ");
  const parts = [
    locale === "en"
      ? `Problem #${item.order} (${heading}), as printed in the PDF the student sees:\n<exercise>\n${item.statement}\n</exercise>`
      : `Άσκηση #${item.order} (${heading}), όπως είναι στο PDF που βλέπει ο μαθητής:\n<exercise>\n${item.statement}\n</exercise>`,
  ];
  if (item.solution) {
    // The solution makes Greg's hints correct; the Socratic rule still
    // governs what the student is shown.
    parts.push(
      locale === "en"
        ? `The official solution — FOR YOU ONLY. Use it to check the student's work and aim your hints, but never reveal it, quote it, or give the final answer. Guide the student one step at a time.\n<solution>\n${item.solution}\n</solution>`
        : `Η επίσημη λύση — ΜΟΝΟ ΓΙΑ ΣΕΝΑ. Χρησιμοποίησέ τη για να ελέγχεις τη δουλειά του μαθητή και να στοχεύεις τα hints σου, αλλά ποτέ μην την αποκαλύψεις, μην την παραθέσεις και μη δώσεις το τελικό αποτέλεσμα. Καθοδήγησε τον μαθητή ένα βήμα τη φορά.\n<solution>\n${item.solution}\n</solution>`
    );
  }
  return parts.join("\n\n");
}

export interface ChatContext {
  page: ChatPage;
  exercise?: ExerciseContext | null;
}

function formatExercise(exercise: ExerciseContext, locale: "el" | "en"): string {
  const rows: string[] = [];
  const label =
    locale === "en"
      ? { title: "Title", category: "Category", level: "Level", tags: "Tags", description: "Description" }
      : { title: "Τίτλος", category: "Κατηγορία", level: "Επίπεδο", tags: "Ετικέτες", description: "Περιγραφή" };

  rows.push(`- ${label.title}: ${exercise.title}`);
  if (exercise.category) rows.push(`- ${label.category}: ${exercise.category}`);
  if (exercise.level) rows.push(`- ${label.level}: ${exercise.level}`);
  if (exercise.tags?.length) rows.push(`- ${label.tags}: ${exercise.tags.join(", ")}`);
  if (exercise.description) rows.push(`- ${label.description}: ${exercise.description}`);

  const header =
    locale === "en"
      ? "The student is looking at this exercise booklet right now:"
      : "Ο μαθητής βλέπει αυτή τη στιγμή αυτό το φυλλάδιο ασκήσεων:";
  const sections = [`${header}\n${rows.join("\n")}`];

  if (exercise.index?.length) {
    const toc = exercise.index
      .map((item) => `#${item.order} ${[item.section, item.label].filter(Boolean).join(" / ")}: ${item.topic}`)
      .join("\n");
    sections.push(
      locale === "en"
        ? `The booklet's problems (use get_exercise with the # number to read one):\n${toc}\n\nWhen the student refers to a problem ("exercise 5", "the one on limits"), find it in this list and read it with get_exercise before helping. If it's unclear which one they mean, ask. Labels can repeat across chapters — use the section to tell them apart.`
        : `Οι ασκήσεις του φυλλαδίου (διάβασε μία με το get_exercise και τον αριθμό #):\n${toc}\n\nΌταν ο μαθητής αναφέρεται σε μια άσκηση ("η άσκηση 5", "αυτή με τα όρια"), βρες την σε αυτή τη λίστα και διάβασέ την με το get_exercise πριν βοηθήσεις. Αν δεν είναι σαφές ποια εννοεί, ρώτα τον. Οι αριθμοί μπορεί να επαναλαμβάνονται σε διαφορετικά κεφάλαια — ξεχώρισέ τες από την ενότητα.`
    );
  } else {
    // No transcript yet. Say so explicitly, or the model will happily invent
    // the problem it thinks the title implies.
    sections.push(
      locale === "en"
        ? "You do NOT have the text of this booklet — only this summary. If you need the actual numbers or wording, ask the student to type the problem out. Never guess what a problem says."
        : "ΔΕΝ έχεις το κείμενο αυτού του φυλλαδίου — μόνο αυτή τη σύνοψη. Αν χρειάζεσαι τους πραγματικούς αριθμούς ή την ακριβή εκφώνηση, ζήτα από τον μαθητή να σου γράψει την άσκηση. Ποτέ μη μαντεύεις τι λέει μια άσκηση."
    );
  }

  if (exercise.activeItem) {
    sections.push(
      (locale === "en"
        ? "The problem you and the student are currently working on:\n"
        : "Η άσκηση που δουλεύετε αυτή τη στιγμή με τον μαθητή:\n") +
        formatExerciseItem(exercise.activeItem, locale)
    );
  }

  return sections.join("\n\n");
}

// Reads one problem of the booklet on the current page. The booklet is
// fixed server-side from the page context; the model only picks a number.
export const GET_EXERCISE_TOOL = {
  name: "get_exercise",
  description:
    "Read the full text of one problem from the booklet the student is viewing, by its # number from the booklet's problem list. Returns the problem statement and, if available, the official solution (for your eyes only).",
  input_schema: {
    type: "object" as const,
    properties: {
      number: {
        type: "integer",
        description: "The problem's # number from the booklet's problem list.",
      },
    },
    required: ["number"],
    additionalProperties: false,
  },
  strict: true,
} satisfies Anthropic.Tool;

// Search the site's own exercise library, so "give me another derivatives
// exercise" gets a real link instead of an invented one.
export const SEARCH_EXERCISES_TOOL = {
  name: "search_exercises",
  description:
    "Search the GregKyrMaths exercise library. Use it when the student asks for practice, a similar exercise, or an exercise on a topic. Matches a single keyword or short phrase against individual problems (topic and text) and booklet titles, categories and tags. Results are problems inside booklets: recommend them as \"problem <label> in [<booklet title>](<link>)\". The library is in Greek — search with Greek terms (e.g. \"παράγωγος\", \"ολοκλήρωμα\", \"τριγωνομετρία\").",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "One Greek keyword or short phrase, e.g. \"παράγωγος\".",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  strict: true,
} satisfies Anthropic.Tool;

// Greg AI offers the human teacher by ending a reply with one of these
// markers; the widget renders it as a contact card. A marker instead of a tool
// keeps it to one model call and no tool schema on every request. The card
// only shows buttons — nothing is sent until the student clicks one.
export const CONTACT_CARD_MARKER_PATTERN = /\[\[contact:(help|lesson)\]\]/g;

// Upper bound on model calls per student message: a tool call (search or
// get_exercise), the answer, and one spare. Each round is billed, so this
// also caps per-message spend.
export const MAX_TOOL_ROUNDS = 3;

export function buildSystemPrompt(
  locale: "el" | "en",
  context?: ChatContext
): string {
  const greek = `Είσαι ο "Greg AI", ένας ζεστός, υπομονετικός μαθηματικός βοηθός για μαθητές Γυμνασίου και Λυκείου στην ιστοσελίδα GregKyrMaths.

Ο ρόλος σου:
- Εξηγείς μαθηματικές έννοιες με απλά λόγια και βήμα προς βήμα.
- ΠΟΤΕ μη δίνεις απευθείας τη λύση. Πρώτα κάνε καθοδηγητικές ερωτήσεις (Σωκρατική μέθοδος) για να καταλάβει ο μαθητής μόνος του.
- Όταν ο μαθητής κολλάει, δίνεις ένα μικρό hint, όχι όλη τη λύση.
- Ενθαρρύνεις και επιβραβεύεις την προσπάθεια.
- Όταν ο μαθητής ζητάει εξάσκηση ή μια παρόμοια άσκηση, ψάχνεις στις ασκήσεις του site με το εργαλείο search_exercises και δίνεις σύνδεσμο με τη μορφή [τίτλος](/exercises/<id>). Προτείνεις μόνο ασκήσεις που επέστρεψε το εργαλείο — ποτέ μην επινοείς συνδέσμους.

Ο Greg (ο πραγματικός καθηγητής του site, κάνει και ιδιαίτερα):
- Αν ο μαθητής ζητάει καθηγητή/άνθρωπο, έχει κολλήσει μετά από αρκετά hints, ή έχει πρόβλημα με το site, τελείωσε την απάντηση με τη γραμμή [[contact:help]]. Για ιδιαίτερα/τιμές/μάθημα: [[contact:lesson]].
- Εμφανίζει κάρτα επικοινωνίας. Μία φορά ανά συζήτηση, εκτός αν το ξαναζητήσει. Μη γράφεις τηλέφωνα ή email.

Μορφοποίηση:
- Γράφεις στα Ελληνικά.
- Για μαθηματικούς τύπους χρησιμοποιείς LaTeX μέσα σε $...$ για inline και $$...$$ για display (η σελίδα έχει MathJax).
- Χρησιμοποιείς λίστες με παύλες και bold (**...**) για έμφαση.
- Σύντομες, καθαρές απαντήσεις. Όχι μεγάλα κατεβατά.

Αυτά που ΔΕΝ κάνεις:
- Δεν απαντάς σε ερωτήσεις άσχετες με μαθηματικά/εκπαίδευση/σχολείο. Ευγενικά πες "Ας μείνουμε στα μαθηματικά!".
- Δεν εμπλέκεσαι σε προσωπικά ή ακατάλληλα θέματα — οι χρήστες είναι μαθητές.`;

  const english = `You are "Greg AI", a warm, patient mathematics tutor for middle and high school students on the GregKyrMaths website.

Your role:
- Explain math concepts in plain language, step by step.
- NEVER give the full solution upfront. Use the Socratic method — ask guiding questions first.
- When the student is stuck, give a small hint, not the whole answer.
- Encourage and praise effort.
- When the student asks for practice or a similar exercise, search the site's exercises with the search_exercises tool and link to them as [title](/exercises/<id>). Only recommend exercises the tool returned — never invent links.

Greg (the site's real teacher, also gives private lessons):
- If the student asks for a teacher/human, is stuck after several hints, or has a problem with the site, end your reply with the line [[contact:help]]. For private lessons/prices/booking: [[contact:lesson]].
- It shows a contact card. Once per conversation unless asked again. Never write phone numbers or emails.

Formatting:
- Reply in English when the student writes in English; in Greek otherwise.
- For math, use LaTeX inside $...$ for inline and $$...$$ for display blocks (the page has MathJax).
- Use bullet lists and **bold** for emphasis.
- Keep answers short and clear.

Don't:
- Don't answer non-math/non-educational questions. Politely redirect: "Let's stick to math!".
- Don't engage in personal or inappropriate topics — users are students.`;

  const base = locale === "en" ? english : greek;
  if (!context) return base;

  const parts = [PAGE_CONTEXT[context.page]];
  if (context.exercise) {
    parts.push(formatExercise(context.exercise, locale));
  }

  return `${base}\n\n${parts.join("\n\n")}`;
}

export const MAX_HISTORY_MESSAGES = 12;
