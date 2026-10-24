/**
 * Transcribes exercise PDFs and "test yourself" problem images for Greg AI
 * (see app/utils/exerciseTranscript.server.ts and trainingTranscript.server.ts).
 *
 * Processes everything whose transcript is missing or was made from a
 * different file, so it doubles as the backfill for existing content and
 * the safety net for uploads whose background transcription didn't finish.
 *
 *   npm run greg:transcribe            # only missing / stale
 *   npm run greg:transcribe -- --force # re-transcribe everything
 *   npm run greg:transcribe -- <id>    # one exercise or training (always re-transcribed)
 *
 * `--deploy` is the mode the Vercel build runs (`npm run build`): it only does
 * anything on production deploys, stops starting new work after a time budget
 * (the rest is picked up by the next deploy), and never fails the build.
 *
 * Each transcription is a paid API call (a few cents per PDF or problem).
 */
import { exerciseSourceKey, transcribeExercise } from "../app/utils/exerciseTranscript.server";
import { prisma } from "../app/utils/prisma.server";
import { trainingSourceKey, transcribeTraining } from "../app/utils/trainingTranscript.server";

// Leaves headroom under Vercel's 45-minute build limit.
const DEPLOY_TIME_BUDGET_MS = 15 * 60 * 1000;
// Training problems are small, independent calls.
const TRAINING_CONCURRENCY = 5;

const deploy = process.argv.includes("--deploy");

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyId = args.find((arg) => !arg.startsWith("--"));

  if (deploy) {
    // Preview deploys share the database; only production should spend.
    if (process.env.VERCEL_ENV !== "production") {
      console.log("[transcribe] skipped: not a Vercel production deploy");
      return;
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("[transcribe] skipped: ANTHROPIC_API_KEY is not set");
      return;
    }
  }

  const deadline = deploy ? Date.now() + DEPLOY_TIME_BUDGET_MS : Infinity;
  const outOfTime = () => Date.now() > deadline;

  const exercises = await prisma.exersice.findMany({
    where: onlyId ? { id: onlyId } : undefined,
    select: {
      id: true,
      title: true,
      cloudinaryPublicId: true,
      fileContentType: true,
      gregSource: true,
    },
  });

  const todo = exercises.filter(
    (ex) => onlyId || force || ex.gregSource !== exerciseSourceKey(ex)
  );
  console.log(`[transcribe] ${todo.length} of ${exercises.length} exercises to transcribe`);

  let failed = 0;
  let deferred = 0;
  // Sequential on purpose: a handful of PDFs, and it keeps rate limits and
  // the log readable.
  for (const ex of todo) {
    if (outOfTime()) {
      deferred++;
      continue;
    }
    try {
      const result = await transcribeExercise(ex.id, { force: true });
      console.log(`[transcribe] ${ex.id} "${ex.title}": ${JSON.stringify(result)}`);
    } catch (error) {
      failed++;
      console.error(`[transcribe] ${ex.id} "${ex.title}" failed:`, error);
    }
  }

  const trainings = await prisma.training.findMany({
    where: onlyId ? { id: onlyId } : undefined,
    select: { id: true, searchableTitle: true, contentImage: true, solutionImage: true, gregSource: true },
  });
  const trainingTodo = trainings.filter(
    (tr) => onlyId || force || tr.gregSource !== trainingSourceKey(tr)
  );
  console.log(`[transcribe] ${trainingTodo.length} of ${trainings.length} training problems to transcribe`);

  let trainingCost = 0;
  let next = 0;
  async function worker() {
    while (next < trainingTodo.length) {
      const tr = trainingTodo[next++];
      if (outOfTime()) {
        deferred++;
        continue;
      }
      try {
        const result = await transcribeTraining(tr.id, { force: true });
        if (result.status === "transcribed") trainingCost += result.costUsd;
        console.log(`[transcribe] ${tr.id} "${tr.searchableTitle}": ${JSON.stringify(result)}`);
      } catch (error) {
        failed++;
        console.error(`[transcribe] ${tr.id} "${tr.searchableTitle}" failed:`, error);
      }
    }
  }
  await Promise.all(Array.from({ length: TRAINING_CONCURRENCY }, worker));
  if (trainingTodo.length > 0) {
    console.log(`[transcribe] training problems cost ~$${trainingCost.toFixed(2)}`);
  }

  if (deferred > 0) {
    console.log(`[transcribe] ${deferred} left for the next run (time budget reached)`);
  }
  if (failed > 0) {
    console.error(`[transcribe] ${failed} failed — re-run to retry them`);
    // A deploy must not fail over this; chats fall back to transcribing on demand.
    if (!deploy) process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[transcribe] failed:", error);
    if (!deploy) process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
