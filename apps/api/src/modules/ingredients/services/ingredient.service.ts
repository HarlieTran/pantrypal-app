import { prisma } from "../../../common/db/prisma.js";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { INGREDIENT_CATEGORIES, type IngredientCategory } from "@pantrypal/shared-types";
import type { MatchedIngredient, ParsedIngredient } from "../../pantry/index.js";
import { stripCodeFence } from "../../../common/ai/bedrock.js";


const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-2",
});
const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const CATEGORY_PROMPT_LIST = INGREDIENT_CATEGORIES.join("|");



function normalize(name: string) {
  return name.trim().toLowerCase();
}

// ─── 1. Exact match against canonicalName ────────────────────────────────────

async function matchExact(rawName: string) {
  return prisma.ingredient.findFirst({
    where: {
      canonicalName: {
        equals: rawName.trim(),
        mode: "insensitive",
      },
      isActive: true,
    },
  });
}

// ─── 2. Alias match ───────────────────────────────────────────────────────────

async function matchAlias(rawName: string) {
  const normalized = normalize(rawName);

  // Fetch all active ingredients and check aliases in JS
  // (Postgres JSON array contains search is limited without extensions)
  const all = await prisma.ingredient.findMany({
    where: { isActive: true },
    select: { id: true, canonicalName: true, aliases: true, category: true },
  });

  for (const ingredient of all) {
    const aliases = ingredient.aliases as string[];
    if (aliases.map(normalize).includes(normalized)) {
      return ingredient;
    }
  }

  return null;
}

// ─── 3. AI fallback ───────────────────────────────────────────────────────────

async function matchViaAI(rawName: string): Promise<{
  canonicalName: string;
  category: IngredientCategory;
} | null> {
  const prompt = [
    "You are a food ingredient normalization assistant.",
    `Given this ingredient name: "${rawName}"`,
    "Return ONLY valid JSON with this exact schema:",
    `{"canonicalName":"string","category":"${CATEGORY_PROMPT_LIST}"}`,
    "Rules:",
    "- canonicalName must be a simple, common English ingredient name (e.g. Tomato, Chicken Breast, Olive Oil).",
    "- Choose the most appropriate category.",
    "- If this is not a food ingredient, return null.",
  ].join("\n");

  const command = new ConverseCommand({
    modelId: BEDROCK_MODEL,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { temperature: 0.1, maxTokens: 200 },
  });

  try {
    const res = await bedrockClient.send(command);
    const rawText =
      res.output?.message?.content?.find((x) => "text" in x)?.text ?? "";
    if (!rawText) return null;

    const parsed = JSON.parse(stripCodeFence(rawText));
    if (!parsed?.canonicalName) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── 4. Save new alias back to Postgres ──────────────────────────────────────

async function saveAlias(ingredientId: string, newAlias: string) {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
  });
  if (!ingredient) return;

  const aliases = ingredient.aliases as string[];
  const normalized = normalize(newAlias);

  if (!aliases.map(normalize).includes(normalized)) {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { aliases: [...aliases, newAlias.trim()] },
    });
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function matchIngredient(
  raw: ParsedIngredient,
): Promise<MatchedIngredient> {
  // 1. Exact match
  const exact = await matchExact(raw.rawName);
  if (exact) {
    return {
      ...raw,
      ingredientId: exact.id,
      canonicalName: exact.canonicalName,
      category: (exact.category ?? raw.category) as MatchedIngredient["category"],
      matchConfidence: "exact",
    };
  }

  // 2. Alias match
  const alias = await matchAlias(raw.rawName);
  if (alias) {
    await saveAlias(alias.id, raw.rawName);
    return {
      ...raw,
      ingredientId: alias.id,
      canonicalName: alias.canonicalName,
      category: (alias.category ?? raw.category) as MatchedIngredient["category"],
      matchConfidence: "alias",
    };
  }

  // 3. AI fallback
  const ai = await matchViaAI(raw.rawName);
  if (ai) {
    // Try to find or create the canonical ingredient
    let ingredient = await prisma.ingredient.findFirst({
      where: {
        canonicalName: { equals: ai.canonicalName, mode: "insensitive" },
      },
    });

    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: {
          canonicalName: ai.canonicalName,
          aliases: [raw.rawName],
          category: ai.category as MatchedIngredient["category"],
        },
      });
    } else {
      await saveAlias(ingredient.id, raw.rawName);
    }

    return {
      ...raw,
      ingredientId: ingredient.id,
      canonicalName: ingredient.canonicalName,
      category: (ingredient.category ?? raw.category) as MatchedIngredient["category"],
      matchConfidence: "ai",
    };
  }

  // 4. Unmatched — store as-is
  return {
    ...raw,
    canonicalName: raw.rawName.trim(),
    matchConfidence: "unmatched",
  };
}

// Convenience: match a batch of parsed ingredients
export async function matchIngredients(
  raws: ParsedIngredient[],
): Promise<MatchedIngredient[]> {
  return Promise.all(raws.map(matchIngredient));
}

