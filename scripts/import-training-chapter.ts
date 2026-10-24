/**
 * Imports a book chapter's web-export (thNN/{exercise,solution}.png + meta.json)
 * as Training exercises with bilingual titles.
 *
 *   npx tsx scripts/import-training-chapter.ts <titles.json> <chapterDir> [--dry-run]
 *
 * Re-runnable: exercises whose searchableTitle already exists are skipped, and
 * Cloudinary public_ids are deterministic so re-uploads overwrite.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

type Bilingual = { el: string; en: string };
type TitlesFile = {
  chapter: number;
  category: string;
  level: string;
  groups: { el: string; en: string; exercises: number[] }[];
  exercises: Record<string, Bilingual>;
};

const [titlesPath, chapterDir, flag] = process.argv.slice(2);
const dryRun = flag === "--dry-run";
if (!titlesPath || !chapterDir) {
  console.error("usage: import-training-chapter.ts <titles.json> <chapterDir> [--dry-run]");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();
const spec: TitlesFile = JSON.parse(readFileSync(titlesPath, "utf-8"));
const pad = (n: number) => String(n).padStart(2, "0");

async function upload(file: string, publicId: string) {
  const result = await cloudinary.uploader.upload(file, {
    folder: "maths-joy/training",
    public_id: publicId,
    resource_type: "image",
    type: "authenticated",
    overwrite: true,
  });
  return result.secure_url;
}

async function main() {
  const groupOf = new Map<number, Bilingual>();
  for (const g of spec.groups) for (const n of g.exercises) groupOf.set(n, g);

  const numbers = Object.keys(spec.exercises).map(Number).sort((a, b) => a - b);
  let created = 0;

  for (const n of numbers) {
    const group = groupOf.get(n);
    if (!group) throw new Error(`Exercise ${n} has no group`);
    const name = spec.exercises[String(n)];
    const searchableTitle = `Θέμα ${spec.chapter}.${n} · ${name.el}`;
    const searchableTitleEn = `Problem ${spec.chapter}.${n} · ${name.en}`;

    const dir = join(chapterDir, `th${pad(n)}`);
    const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf-8"));
    if (meta.number !== n) throw new Error(`meta mismatch in ${dir}`);

    const exists = await prisma.training.findFirst({ where: { searchableTitle } });
    if (exists) {
      console.log(`skip  ${n}: already exists`);
      continue;
    }
    if (dryRun) {
      console.log(`dry   ${n}: [${group.el} / ${group.en}] ${searchableTitle} | ${searchableTitleEn}`);
      continue;
    }

    const base = `ch${pad(spec.chapter)}-th${pad(n)}`;
    const contentImage = await upload(join(dir, meta.exercise), `${base}-exercise`);
    const solutionImage = await upload(join(dir, meta.solution), `${base}-solution`);

    const now = new Date();
    await prisma.training.create({
      data: {
        title: group.el,
        category: spec.category,
        tags: spec.level,
        searchableTitle,
        contentImage,
        solutionImage,
        content: "",
        solution: "",
        translation: {
          el: { title: group.el, searchableTitle },
          en: { title: group.en, searchableTitle: searchableTitleEn },
        },
        createdAt: now,
        updatedAt: now,
      } as Parameters<typeof prisma.training.create>[0]["data"],
    });
    created++;
    console.log(`ok    ${n}: ${searchableTitle}`);
  }

  console.log(`${dryRun ? "dry run" : "done"}: ${created} created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
