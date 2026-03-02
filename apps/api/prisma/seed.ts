import { PrismaClient, QuestionType } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function upsertQuestion(
  key: string,
  label: string,
  type: QuestionType,
  sortOrder: number,
  isRequired = false,
) {
  return prisma.question.upsert({
    where: { key },
    update: { label, type, sortOrder, isRequired, isActive: true },
    create: { key, label, type, sortOrder, isRequired, isActive: true },
  });
}

async function upsertOption(questionId: string, value: string, label: string, sortOrder: number) {
  return prisma.questionOption.upsert({
    where: { questionId_value: { questionId, value } },
    update: { label, sortOrder, isActive: true },
    create: { questionId, value, label, sortOrder, isActive: true },
  });
}

type ManifestItem = {
  id?: string;
  filename?: string;
  s3Key?: string;
  title?: string;
  tags?: {
    cuisine?: string;
    protein?: string;
    dietary?: string[];
    flavor?: string[];
    complexity?: string;
    mealType?: string;
  };
  cuisine?: string;
  dietTags?: string[];
  proteinTags?: string[];
  spiceLevel?: string;
  extraTags?: string[];
};

async function seedCuratedRecipeImages() {
  const manifestPath = path.resolve("prisma/seed-data/manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.warn(`manifest not found, skipping curated image seed: ${manifestPath}`);
    return;
  }

  const raw = fs.readFileSync(manifestPath, "utf8");
  const items = JSON.parse(raw) as ManifestItem[];

  for (const item of items) {
    const s3Key = item.s3Key ?? item.filename;
    if (!s3Key) {
      console.warn("Skipping manifest item without s3 key/filename", item);
      continue;
    }

    const title =
      item.title ??
      item.id
        ?.split("-")
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join(" ") ??
      s3Key;

    const dietTags = item.dietTags ?? item.tags?.dietary ?? [];
    const proteinTags = item.proteinTags ?? (item.tags?.protein ? [item.tags.protein] : []);
    const extraTags = item.extraTags ?? [item.tags?.mealType, ...(item.tags?.flavor ?? [])].filter(
      Boolean,
    ) as string[];

    await prisma.curatedRecipeImage.upsert({
      where: { s3Key },
      update: {
        title,
        cuisine: item.cuisine ?? item.tags?.cuisine ?? null,
        dietTags,
        proteinTags,
        spiceLevel: item.spiceLevel ?? item.tags?.complexity ?? null,
        extraTags,
        isActive: true,
      },
      create: {
        s3Key,
        title,
        cuisine: item.cuisine ?? item.tags?.cuisine ?? null,
        dietTags,
        proteinTags,
        spiceLevel: item.spiceLevel ?? item.tags?.complexity ?? null,
        extraTags,
        isActive: true,
      },
    });
  }
}

async function main() {
  const allergies = await upsertQuestion("allergies", "Allergies", "MULTI_CHOICE", 1, false);
  const diet = await upsertQuestion("diet", "Diet Preference", "MULTI_CHOICE", 2, false);
  await upsertQuestion("allergies_other", "Other allergies", "FREE_TEXT", 3, false);
  await upsertQuestion("diet_notes", "Diet notes", "FREE_TEXT", 4, false);
  await upsertQuestion("disliked_ingredients", "Disliked ingredients", "FREE_TEXT", 5, false);

  const allergyOptions = ["peanuts", "tree_nuts", "dairy", "eggs", "gluten", "shellfish", "soy"];
  for (let i = 0; i < allergyOptions.length; i++) {
    const v = allergyOptions[i];
    await upsertOption(allergies.id, v, v.replace("_", " "), i + 1);
  }

  const dietOptions = ["omnivore", "vegetarian", "vegan", "pescatarian", "halal", "kosher", "keto"];
  for (let i = 0; i < dietOptions.length; i++) {
    const v = dietOptions[i];
    await upsertOption(diet.id, v, v, i + 1);
  }

  await seedCuratedRecipeImages();
}

main().finally(() => prisma.$disconnect());
