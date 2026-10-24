import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./anthropic.server";
import { TRANSCRIBE_MODEL } from "./exerciseTranscript.server";
import { prisma } from "./prisma.server";

/**
 * Turns a "test yourself" problem (two images: the problem and its official
 * solution) into text Greg AI can read. Runs once per image pair and is
 * stored on the Training row, so chat turns read text instead of paying for
 * images every message.
 */

// One problem and one solution is ~1–2k tokens of maths.
const MAX_TOKENS = 8000;

// Opus 5.5 list prices, USD per million tokens — for the cost line in logs.
const INPUT_USD_PER_MTOK = 4;
const OUTPUT_USD_PER_MTOK = 20;

const TRANSCRIPT_SCHEMA = {
  type: "object",
  properties: {
    statement: { type: "string" },
    solution: { type: "string" },
  },
  required: ["statement", "solution"],
  additionalProperties: false,
} as const;

const PROMPT = `The first image is a maths problem from a Greek secondary-school tutoring site; the second is its official worked solution. Transcribe both so a tutor who cannot see the images can work with the problem.

- "statement": everything the student is given — text, every sub-question with its numbering (α, β, γ… or i, ii…), all data.
- "solution": the full worked solution from the second image. "" if it has none.

Rules:
- Keep the original language. Do not translate.
- Write all mathematics in LaTeX: $...$ inline, $$...$$ for display equations.
- Transcribe exactly — every number, sign, exponent and index matters. Do not fix, simplify or complete anything.
- For a figure or graph, write a short bracketed description of what it shows, e.g. [Σχήμα: τρίγωνο ΑΒΓ με ΑΒ = 5].
- Leave out headers, logos and watermarks.`;

/** Identifies the image pair a transcript was made from. */
export function trainingSourceKey(training: { contentImage: string; solutionImage: string }): string {
  return `${training.contentImage}|${training.solutionImage}`;
}

export type TrainingTranscribeResult =
  | { status: "transcribed"; costUsd: number }
  | { status: "up_to_date" }
  | { status: "no_image" };

/**
 * Transcribes one training problem. Skips it when the stored text already
 * matches the current images unless `force` is set. Throws on API failure;
 * nothing is written unless the call succeeded.
 */
export async function transcribeTraining(
  id: string,
  { force = false }: { force?: boolean } = {}
): Promise<TrainingTranscribeResult> {
  const training = await prisma.training.findUnique({
    where: { id },
    select: { contentImage: true, solutionImage: true, gregSource: true },
  });
  if (!training) throw new Error(`Training ${id} not found`);
  if (!training.contentImage) return { status: "no_image" };

  const sourceKey = trainingSourceKey(training);
  if (!force && training.gregSource === sourceKey) return { status: "up_to_date" };

  // The stored Cloudinary URLs are signed delivery URLs the browser already
  // loads directly, so the API can fetch them the same way.
  const images: Anthropic.Beta.BetaContentBlockParam[] = [training.contentImage, training.solutionImage]
    .filter(Boolean)
    .map((url) => ({ type: "image", source: { type: "url", url } }));

  const stream = getAnthropic().beta.messages.stream({
    model: TRANSCRIBE_MODEL,
    max_tokens: MAX_TOKENS,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: TRANSCRIPT_SCHEMA },
    },
    messages: [{ role: "user", content: [...images, { type: "text", text: PROMPT }] }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") throw new Error(`Training ${id}: transcription refused`);
  if (message.stop_reason === "max_tokens") throw new Error(`Training ${id}: transcription overflowed`);

  const text = (message.content as Anthropic.Beta.BetaContentBlock[])
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
  const parsed = JSON.parse(text) as { statement: string; solution: string };
  if (!parsed.statement.trim()) throw new Error(`Training ${id}: no problem found in the image`);

  await prisma.training.update({
    where: { id },
    data: {
      gregStatement: parsed.statement.trim(),
      gregSolution: parsed.solution.trim() || null,
      gregSource: sourceKey,
      gregTranscribedAt: new Date(),
    },
  });

  return {
    status: "transcribed",
    costUsd:
      Math.round(
        ((message.usage.input_tokens * INPUT_USD_PER_MTOK +
          message.usage.output_tokens * OUTPUT_USD_PER_MTOK) /
          1_000_000) *
          100
      ) / 100,
  };
}

// Problems being transcribed by this server instance, so a burst of chat
// messages on one untranscribed problem starts one job, not one each.
const inFlight = new Set<string>();

/**
 * Fire-and-forget wrapper for admin uploads and for a chat that finds a
 * problem without text. Anything missed (errors, or a serverless instance
 * frozen after the response) is picked up by `npm run greg:transcribe`.
 */
export function transcribeTrainingInBackground(id: string): void {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  transcribeTraining(id)
    .catch((error) => {
      console.error(`[greg-ai] transcription failed for training ${id}:`, error);
    })
    .finally(() => inFlight.delete(id));
}
