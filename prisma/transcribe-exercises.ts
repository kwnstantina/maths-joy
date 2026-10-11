/**
 * Transcribes exercise PDFs for Greg AI (see app/utils/exerciseTranscript.server.ts).
 *
 * Processes every exercise whose transcript is missing or was made from a
 * different file, so it doubles as the backfill for existing exercises and
 * the safety net for uploads whose background transcription didn't finish.
 *
 *   npm run greg:transcribe            # only missing / stale exercises
 *   npm run greg:transcribe -- --force # re-transcribe everything
 *   npm run greg:transcribe -- <id>    # one exercise (always re-transcribed)
 *
 * Each transcription is a paid API call (a few cents per PDF).
 */
import { exerciseSourceKey, transcribeExercise } from "../app/utils/exerciseTranscript.server";
import { prisma } from "../app/utils/prisma.server";

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyId = args.find((arg) => !arg.startsWith("--"));

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
  // Sequential on purpose: a handful of PDFs, and it keeps rate limits and
  // the log readable.
  for (const ex of todo) {
    try {
      const result = await transcribeExercise(ex.id, { force: true });
      console.log(`[transcribe] ${ex.id} "${ex.title}": ${JSON.stringify(result)}`);
    } catch (error) {
      failed++;
      console.error(`[transcribe] ${ex.id} "${ex.title}" failed:`, error);
    }
  }

  if (failed > 0) {
    console.error(`[transcribe] ${failed} failed — re-run to retry them`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[transcribe] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
