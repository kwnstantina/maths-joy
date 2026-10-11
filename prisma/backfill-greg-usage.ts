/**
 * One-time backfill for the Greg AI cost-accounting fields.
 *
 * `inputTokens`, `outputTokens` and `spend` were added to GregDailyUsage after
 * the chat had already been writing rows. MongoDB is schemaless, so those
 * older documents simply lack the fields — and Prisma reads a missing
 * non-nullable Int as an inconsistent result. This sets them to 0 wherever
 * they are absent; already-populated rows are untouched.
 *
 * Run once, after `npm run prisma:push`:
 *   npm run prisma:backfill-greg-usage
 *
 * Safe to re-run — the queries match only documents still missing the field.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLLECTION = "GregDailyUsage";
const FIELDS = ["inputTokens", "outputTokens", "spend"] as const;

async function main() {
  const result = (await prisma.$runCommandRaw({
    update: COLLECTION,
    updates: FIELDS.map((field) => ({
      q: { [field]: { $exists: false } },
      u: { $set: { [field]: 0 } },
      multi: true,
    })),
  })) as { n?: number; nModified?: number };

  console.log(
    `[backfill] matched ${result.n ?? 0}, modified ${result.nModified ?? 0} document-updates across ${FIELDS.join(", ")}`
  );
}

main()
  .catch((error) => {
    console.error("[backfill] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
