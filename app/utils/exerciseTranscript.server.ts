import type Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { getAnthropic } from "./anthropic.server";
import { generateSignedUrl } from "./cloudinary.server";
import { prisma } from "./prisma.server";

/**
 * Turns an exercise booklet PDF into ExerciseItem rows Greg AI can read: one
 * per problem, each with its statement and (if the booklet has one) its
 * solution, as Markdown with LaTeX math.
 *
 * Runs once per PDF, not per chat message. Booklets run to 80+ pages, so the
 * PDF is split into page chunks transcribed in parallel, then stitched back
 * together: problems that straddle a chunk boundary are joined, and solutions
 * printed in a separate section are matched back to their problem.
 */

// One-off and accuracy-sensitive: a misread exponent or sign makes every
// hint Greg gives about the exercise wrong.
export const TRANSCRIBE_MODEL = "claude-opus-5-5";

// ~8 pages of dense maths is ~10k output tokens — well inside max_tokens.
// A chunk that still overflows is split in half and retried.
const PAGES_PER_CHUNK = 8;
const CHUNK_MAX_TOKENS = 32000;
const CHUNK_CONCURRENCY = 3;

// Opus 5.5 list prices, USD per million tokens — for the cost line in logs.
const INPUT_USD_PER_MTOK = 4;
const OUTPUT_USD_PER_MTOK = 20;

// The Messages API caps a request at 32 MB; base64 inflates by ~4/3.
const MAX_PDF_BYTES = 20 * 1024 * 1024;

type PieceKind = "exercise" | "continuation" | "solution";

interface Piece {
  kind: PieceKind;
  section: string;
  label: string;
  topic: string;
  statement: string;
  solution: string;
}

const PIECE_SCHEMA = {
  type: "object",
  properties: {
    pieces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["exercise", "continuation", "solution"] },
          section: { type: "string" },
          label: { type: "string" },
          topic: { type: "string" },
          statement: { type: "string" },
          solution: { type: "string" },
        },
        required: ["kind", "section", "label", "topic", "statement", "solution"],
        additionalProperties: false,
      },
    },
  },
  required: ["pieces"],
  additionalProperties: false,
} as const;

function chunkPrompt(firstPage: number, lastPage: number, totalPages: number): string {
  return `These are pages ${firstPage}–${lastPage} of a ${totalPages}-page maths exercise booklet from a Greek secondary-school tutoring site. Transcribe them so a tutor who cannot see the PDF can work with each problem.

Return "pieces" in page order. Each piece is one of:
- "exercise": a problem that starts on these pages. "statement" is everything the student is given — text, every sub-question with its numbering (α, β, γ… or i, ii…), all data. If its worked solution follows directly on these pages, put it in "solution"; otherwise "".
- "continuation": content at the very top of the first page that continues a problem or solution begun on an earlier page (no new problem heading). Put the continued text in "statement" or "solution" as appropriate.
- "solution": a solution printed separately from its problem (e.g. in an answers section). "label" must be the label of the problem it solves, as printed on the problem. "statement" is "".

Fields:
- "label": the problem's number or heading as printed — "Άσκηση 5", "Θέμα Β", "3.". "" for a continuation.
- "section": the chapter or unit heading this falls under, if one is visible on these pages; otherwise "".
- "topic": one short line on what the problem is about, in Greek, e.g. "Παράγωγος σύνθετης συνάρτησης". "" for a continuation or solution.

Rules:
- Keep the original language. Do not translate.
- Write all mathematics in LaTeX: $...$ inline, $$...$$ for display equations.
- Transcribe exactly — every number, sign, exponent and index matters. Do not fix, simplify or complete anything.
- For a figure or graph, write a short bracketed description of what it shows, e.g. [Σχήμα: τρίγωνο ΑΒΓ με ΑΒ = 5].
- Leave out page headers, footers, logos, watermarks, and the table of contents.
- If these pages contain no problems or solutions (cover, theory only), return an empty list.`;
}

/**
 * Identifies the file a transcript was made from. Admin updates always upload
 * a new Cloudinary file (new public id); legacy base64 PDFs can't be replaced
 * through the admin UI, so a fixed key is enough for them.
 */
export function exerciseSourceKey(exercise: {
  cloudinaryPublicId: string | null;
  fileContentType: string | null;
}): string | null {
  if (exercise.cloudinaryPublicId) return `cloudinary:${exercise.cloudinaryPublicId}`;
  if (exercise.fileContentType) return "legacy";
  return null;
}

async function loadPdfBytes(exercise: {
  cloudinaryPublicId: string | null;
  fileContentType: string | null;
}): Promise<Buffer> {
  if (exercise.cloudinaryPublicId) {
    // Uploads are `type: "authenticated"`, so the stored secure_url 401s.
    const url = generateSignedUrl(exercise.cloudinaryPublicId, {
      resourceType: "raw",
      expiresIn: 300,
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PDF download failed: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // Legacy rows hold the whole file as a data URL.
  const dataUrl = exercise.fileContentType ?? "";
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:application/pdf;base64,") || comma === -1) {
    throw new Error("Legacy file is not a base64 PDF data URL");
  }
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

async function extractPages(source: PDFDocument, from: number, to: number): Promise<string> {
  const chunk = await PDFDocument.create();
  const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
  const pages = await chunk.copyPages(source, indices);
  pages.forEach((page) => chunk.addPage(page));
  const bytes = Buffer.from(await chunk.save());
  if (bytes.length > MAX_PDF_BYTES) throw new Error(`Pages ${from}–${to} exceed the size limit`);
  return bytes.toString("base64");
}

interface ChunkResult {
  pieces: Piece[];
  usage: { input: number; output: number };
}

class ChunkOverflowError extends Error {}

async function transcribeChunk(
  source: PDFDocument,
  from: number,
  to: number,
  totalPages: number
): Promise<ChunkResult> {
  const pdf = await extractPages(source, from, to);

  // Streamed so a dense chunk can't hit the SDK's HTTP timeout.
  const stream = getAnthropic().beta.messages.stream({
    model: TRANSCRIBE_MODEL,
    max_tokens: CHUNK_MAX_TOKENS,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // Transcription is reading, not reasoning — low effort keeps thinking
    // from eating the output budget.
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: PIECE_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdf },
          },
          { type: "text", text: chunkPrompt(from, to, totalPages) },
        ],
      },
    ],
  });
  const message = await stream.finalMessage();
  const usage = {
    input: message.usage.input_tokens,
    output: message.usage.output_tokens,
  };

  if (message.stop_reason === "refusal") {
    throw new Error(`Pages ${from}–${to}: transcription refused by the model`);
  }
  if (message.stop_reason === "max_tokens") {
    throw Object.assign(new ChunkOverflowError(`Pages ${from}–${to} overflowed`), { usage });
  }

  const text = (message.content as Anthropic.Beta.BetaContentBlock[])
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
  const parsed = JSON.parse(text) as { pieces: Piece[] };
  return { pieces: parsed.pieces, usage };
}

/** Transcribes pages from–to, halving the range on overflow. */
async function transcribeRange(
  source: PDFDocument,
  from: number,
  to: number,
  totalPages: number,
  spent: { input: number; output: number }
): Promise<Piece[]> {
  try {
    const result = await transcribeChunk(source, from, to, totalPages);
    spent.input += result.usage.input;
    spent.output += result.usage.output;
    return result.pieces;
  } catch (error) {
    if (!(error instanceof ChunkOverflowError) || from === to) throw error;
    const wasted = (error as ChunkOverflowError & { usage: { input: number; output: number } }).usage;
    spent.input += wasted.input;
    spent.output += wasted.output;
    const mid = Math.floor((from + to) / 2);
    const first = await transcribeRange(source, from, mid, totalPages, spent);
    const second = await transcribeRange(source, mid + 1, to, totalPages, spent);
    return [...first, ...second];
  }
}

/** Runs async tasks with at most `limit` in flight, preserving order. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** "Άσκηση 5", "5.", "Λύση άσκησης 5" → "5" — for matching solutions to problems. */
function labelKey(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ασκησης|ασκηση|λυσεις|λυση|θεμα|exercise|solution/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export interface StitchedItem {
  section: string | null;
  label: string;
  topic: string;
  statement: string;
  solution: string;
}

/**
 * The Greek prose words of a statement. Two transcriptions of the same
 * problem differ in LaTeX spelling (`\mathrm{d}x` vs `dx`, `\left(`), option
 * markers (Ⓐ vs A) and `$` placement, but not in their words.
 */
function proseWords(statement: string): Set<string> {
  const words = statement
    .replace(/\\[a-zA-Z]+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^Ͱ-Ͽ]+/)
    .filter((word) => word.length >= 3);
  return new Set(words);
}

function sameProse(a: string, b: string): boolean {
  const wordsA = proseWords(a);
  const wordsB = proseWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  let shared = 0;
  for (const word of wordsA) if (wordsB.has(word)) shared++;
  return shared / (wordsA.size + wordsB.size - shared) >= 0.6;
}

/**
 * Many booklets list the problems, then reprint each one with its solution in
 * an answers section — so the same problem arrives twice, as two "exercise"
 * pieces. Same label, same section and mostly the same wording means it's a
 * reprint, not a new problem. (Label alone isn't enough: numbering restarts
 * per chapter, and section headings aren't always visible in a chunk.)
 */
export function findReprint(items: StitchedItem[], candidate: StitchedItem): StitchedItem | undefined {
  const key = labelKey(candidate.label);
  return items.find(
    (item) =>
      labelKey(item.label) === key &&
      item.section === candidate.section &&
      sameProse(item.statement, candidate.statement)
  );
}

/** Folds a reprint's solution into the original problem. */
export function mergeReprint(original: StitchedItem, reprint: StitchedItem): void {
  if (reprint.solution && !original.solution.includes(reprint.solution)) {
    original.solution += `${original.solution ? "\n\n" : ""}${reprint.solution}`;
  }
}

/**
 * Joins chunk output back into whole problems: continuations are appended to
 * the problem before them, and separately-printed solutions are matched to
 * their problem by label (preferring the same section, then the first
 * problem with that label still lacking a solution).
 */
function stitch(pieces: Piece[]): { items: StitchedItem[]; unmatchedSolutions: number } {
  const items: StitchedItem[] = [];
  const looseSolutions: { piece: Piece; section: string | null }[] = [];
  let currentSection: string | null = null;
  // A continuation belongs to whatever came last: a problem, a loose
  // solution, or a reprint. Only a fresh problem takes statement text — a
  // reprint's statement continuation would duplicate the original's.
  let lastTarget: { target: { statement: string; solution: string }; takesStatement: boolean } | null =
    null;

  for (const piece of pieces) {
    if (piece.section.trim()) currentSection = piece.section.trim();

    if (piece.kind === "continuation") {
      if (!lastTarget) continue;
      const { target, takesStatement } = lastTarget;
      if (piece.statement.trim() && takesStatement) {
        target.statement += `\n\n${piece.statement.trim()}`;
      }
      if (piece.solution.trim()) {
        target.solution += `${target.solution ? "\n\n" : ""}${piece.solution.trim()}`;
      }
      continue;
    }

    if (piece.kind === "solution") {
      const loose = { piece: { ...piece, solution: piece.solution.trim() }, section: currentSection };
      looseSolutions.push(loose);
      lastTarget = { target: loose.piece, takesStatement: false };
      continue;
    }

    if (!piece.statement.trim()) continue;
    const item: StitchedItem = {
      section: currentSection,
      label: piece.label.trim() || `#${items.length + 1}`,
      topic: piece.topic.trim(),
      statement: piece.statement.trim(),
      solution: piece.solution.trim(),
    };
    const original = findReprint(items, item);
    if (original) {
      mergeReprint(original, item);
      lastTarget = { target: original, takesStatement: false };
      continue;
    }
    items.push(item);
    lastTarget = { target: item, takesStatement: true };
  }

  let unmatchedSolutions = 0;
  for (const { piece, section } of looseSolutions) {
    if (!piece.solution) continue;
    const key = labelKey(piece.label);
    const candidates = items.filter((item) => labelKey(item.label) === key);
    const sameSection = (item: StitchedItem) =>
      Boolean(section && item.section) &&
      (item.section!.includes(section!) || section!.includes(item.section!));
    const target =
      candidates.find((item) => !item.solution && sameSection(item)) ??
      candidates.find((item) => !item.solution) ??
      (candidates.length === 1 ? candidates[0] : undefined);
    if (!target) {
      unmatchedSolutions++;
      continue;
    }
    target.solution += `${target.solution ? "\n\n" : ""}${piece.solution}`;
  }

  return { items, unmatchedSolutions };
}

export type TranscribeResult =
  | {
      status: "transcribed";
      pages: number;
      items: number;
      withSolution: number;
      unmatchedSolutions: number;
      costUsd: number;
    }
  | { status: "up_to_date" }
  | { status: "no_file" };

/**
 * Transcribes one booklet and replaces its ExerciseItem rows. Skips booklets
 * whose items already match the current file unless `force` is set. Throws on
 * download or API failure — callers decide whether that matters; nothing is
 * written unless every chunk succeeded.
 */
export async function transcribeExercise(
  id: string,
  { force = false }: { force?: boolean } = {}
): Promise<TranscribeResult> {
  const exercise = await prisma.exersice.findUnique({
    where: { id },
    select: {
      cloudinaryPublicId: true,
      fileContentType: true,
      gregSource: true,
    },
  });
  if (!exercise) throw new Error(`Exercise ${id} not found`);

  const sourceKey = exerciseSourceKey(exercise);
  if (!sourceKey) return { status: "no_file" };
  if (!force && exercise.gregSource === sourceKey) return { status: "up_to_date" };

  const source = await PDFDocument.load(await loadPdfBytes(exercise), {
    ignoreEncryption: true,
  });
  const totalPages = source.getPageCount();

  const ranges: [number, number][] = [];
  for (let from = 1; from <= totalPages; from += PAGES_PER_CHUNK) {
    ranges.push([from, Math.min(from + PAGES_PER_CHUNK - 1, totalPages)]);
  }

  const spent = { input: 0, output: 0 };
  const chunks = await mapWithConcurrency(ranges, CHUNK_CONCURRENCY, ([from, to]) =>
    transcribeRange(source, from, to, totalPages, spent)
  );
  const { items, unmatchedSolutions } = stitch(chunks.flat());
  if (items.length === 0) throw new Error("No exercises found in the PDF");

  const now = new Date();
  await prisma.$transaction([
    prisma.exerciseItem.deleteMany({ where: { exerciseId: id } }),
    prisma.exerciseItem.createMany({
      data: items.map((item, index) => ({
        exerciseId: id,
        order: index + 1,
        section: item.section,
        label: item.label,
        topic: item.topic || item.label,
        statement: item.statement,
        solution: item.solution || null,
        createdAt: now,
      })),
    }),
    prisma.exersice.update({
      where: { id },
      data: { gregSource: sourceKey, gregTranscribedAt: now },
    }),
  ]);

  return {
    status: "transcribed",
    pages: totalPages,
    items: items.length,
    withSolution: items.filter((item) => item.solution).length,
    unmatchedSolutions,
    costUsd:
      Math.round(
        ((spent.input * INPUT_USD_PER_MTOK + spent.output * OUTPUT_USD_PER_MTOK) / 1_000_000) * 100
      ) / 100,
  };
}

/**
 * Fire-and-forget wrapper for the admin upload paths: the upload must never
 * fail or wait because transcription did. Anything missed here (errors, or a
 * serverless instance frozen after the response) is picked up by
 * `npm run greg:transcribe`, which only processes stale exercises.
 */
export function transcribeExerciseInBackground(id: string): void {
  transcribeExercise(id).catch((error) => {
    console.error(`[greg-ai] transcription failed for exercise ${id}:`, error);
  });
}
