import { prisma } from "../../../common/db/prisma.js";
import { stripCodeFence } from "../../../common/ai/bedrock.js";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { getUserProfileIdBySubject } from "./profile.service.js";
import { getUserFeedPreferencesBySubject } from "./profile.service.js";
import { getPantryItems } from "../../pantry/index.js";
import { getCookingHistory } from "../../recipes/index.js";
import { s3 } from "../../../common/storage/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const RECIPE_CACHE_BUCKET = process.env.S3_BUCKET_RECIPE_CACHE || "";
const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-2";
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const bedrock = new BedrockRuntimeClient({ region: BEDROCK_REGION });

type SummaryPrediction = {
  type: "expiry_risk" | "cooking_pattern" | "planning_opportunity" | "shopping_pattern";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
};

type SummarySuggestion = {
  type: "cook_now" | "plan_meals" | "use_saved_recipe" | "review_pantry";
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  cta: "find_recipes" | "open_planner" | "view_pantry" | "view_saved_recipes";
};

type SummaryIntelligence = {
  headline: string;
  narrative: string;
  predictions: SummaryPrediction[];
  suggestions: SummarySuggestion[];
};

type SummarySnapshot = {
  totalPantryItems: number;
  expiringSoonCount: number;
  expiredCount: number;
  savedRecipesCount: number;
  totalCooked: number;
  thisMonthCooked: number;
  currentStreak: number;
};

function safeList(values: string[], limit = 5) {
  return values.filter(Boolean).slice(0, limit);
}

function clampPredictions(predictions: SummaryPrediction[]) {
  return predictions.slice(0, 4);
}

function clampSuggestions(suggestions: SummarySuggestion[]) {
  return suggestions.slice(0, 5);
}

function buildFallbackIntelligence(input: {
  snapshot: SummarySnapshot;
  expiringSoonItems: Array<{ name: string; daysUntilExpiry: number | null }>;
  riskyCategories: string[];
  savedRecipeTitles: string[];
  recentRecipeTitles: string[];
}): SummaryIntelligence {
  const { snapshot, expiringSoonItems, riskyCategories, savedRecipeTitles, recentRecipeTitles } = input;
  const topExpiring = expiringSoonItems.slice(0, 2).map((item) => item.name);

  let headline = "Your pantry looks stable this week.";
  let narrative = "Keep an eye on your pantry health and turn saved recipes into actual meals.";

  if (snapshot.expiringSoonCount > 0) {
    headline = `You have ${snapshot.expiringSoonCount} item${snapshot.expiringSoonCount !== 1 ? "s" : ""} that need attention soon.`;
    narrative = topExpiring.length > 0
      ? `${topExpiring.join(" and ")} should be used soon to reduce waste and make better use of your pantry.`
      : "A few pantry items are approaching their expiry window, so this is a good time to cook from what you already have.";
  } else if (snapshot.currentStreak > 0) {
    headline = `You are on a ${snapshot.currentStreak}-day cooking streak.`;
    narrative = "Your recent momentum is strong, so this is a good time to plan your next meal around what is already in the pantry.";
  } else if (snapshot.savedRecipesCount > 0) {
    headline = `You have ${snapshot.savedRecipesCount} saved recipe${snapshot.savedRecipesCount !== 1 ? "s" : ""} waiting.`;
    narrative = "Your saved recipes are a good next step if you want to cook without overbuying this week.";
  }

  const predictions: SummaryPrediction[] = [];
  const suggestions: SummarySuggestion[] = [];

  if (snapshot.expiringSoonCount > 0) {
    predictions.push({
      type: "expiry_risk",
      title: "Fresh ingredients are your biggest risk",
      detail: riskyCategories.length > 0
        ? `${riskyCategories.join(" and ")} are the main pressure points in your pantry right now.`
        : "A few pantry items are likely to become waste if they are not used soon.",
      confidence: "high",
    });

    suggestions.push({
      type: "cook_now",
      title: "Cook from your pantry tonight",
      detail: topExpiring.length > 0
        ? `Build a meal around ${topExpiring.join(" and ")} before they expire.`
        : "Use soon-to-expire items first to reduce waste this week.",
      priority: "high",
      cta: "find_recipes",
    });
  }

  if (snapshot.savedRecipesCount > 0) {
    predictions.push({
      type: "planning_opportunity",
      title: "Saved recipes can help reduce overbuying",
      detail: savedRecipeTitles.length > 0
        ? `You already have options like ${savedRecipeTitles.slice(0, 2).join(" and ")} ready to revisit.`
        : "Your saved recipes are a quick path to turning pantry ingredients into meals.",
      confidence: "medium",
    });

    suggestions.push({
      type: "use_saved_recipe",
      title: "Revisit your saved recipes",
      detail: "Pick one of your saved meals first before adding more ideas to the queue.",
      priority: "medium",
      cta: "view_saved_recipes",
    });
  }

  if (snapshot.totalPantryItems > 0) {
    suggestions.push({
      type: "plan_meals",
      title: "Plan around what you already have",
      detail: "Generate a grocery list only after checking what your pantry can already cover.",
      priority: snapshot.expiringSoonCount > 0 ? "high" : "medium",
      cta: "open_planner",
    });
  }

  if (snapshot.expiredCount > 0) {
    predictions.push({
      type: "shopping_pattern",
      title: "Waste risk is starting to build",
      detail: `You already have ${snapshot.expiredCount} expired item${snapshot.expiredCount !== 1 ? "s" : ""}, so earlier planning may help next week.`,
      confidence: "medium",
    });

    suggestions.push({
      type: "review_pantry",
      title: "Review your pantry before your next shop",
      detail: "Check what is expired or close to expiring before adding more ingredients.",
      priority: "medium",
      cta: "view_pantry",
    });
  }

  if (recentRecipeTitles.length > 0) {
    predictions.push({
      type: "cooking_pattern",
      title: "You already have cooking momentum to build on",
      detail: `Recent meals like ${recentRecipeTitles.slice(0, 2).join(" and ")} suggest you can keep the week moving with another quick cook.`,
      confidence: "low",
    });
  }

  return {
    headline,
    narrative,
    predictions: clampPredictions(predictions),
    suggestions: clampSuggestions(suggestions),
  };
}

async function generateSummaryIntelligence(input: {
  snapshot: SummarySnapshot;
  pantryHealth: {
    totalItems: number;
    freshCount: number;
    expiringCount: number;
    expiredCount: number;
    noDateCount: number;
    categoryBreakdown: { category: string; count: number }[];
  };
  expiringSoonItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    daysUntilExpiry: number | null;
  }>;
  riskyCategories: string[];
  cookingActivity: {
    totalCooked: number;
    thisMonthCooked: number;
    currentStreak: number;
    recentRecipeTitles: string[];
  };
  savedRecipes: {
    total: number;
    recentTitles: string[];
  };
  tasteProfile: {
    likes: string[];
    dislikes: string[];
    dietSignals: string[];
    allergies: string[];
  };
}): Promise<SummaryIntelligence> {
  const fallback = buildFallbackIntelligence({
    snapshot: input.snapshot,
    expiringSoonItems: input.expiringSoonItems.map((item) => ({
      name: item.name,
      daysUntilExpiry: item.daysUntilExpiry,
    })),
    riskyCategories: input.riskyCategories,
    savedRecipeTitles: input.savedRecipes.recentTitles,
    recentRecipeTitles: input.cookingActivity.recentRecipeTitles,
  });

  try {
    const prompt = [
      "You are a pantry and meal-planning intelligence assistant for a consumer cooking app.",
      "Use only the structured facts provided below.",
      "Do not invent pantry items, recipes, user preferences, or behavior.",
      "Prioritize realistic waste reduction, cooking momentum, and next-best actions.",
      "Return ONLY valid JSON with this exact schema:",
      '{"headline":"string","narrative":"string","predictions":[{"type":"expiry_risk|cooking_pattern|planning_opportunity|shopping_pattern","title":"string","detail":"string","confidence":"high|medium|low"}],"suggestions":[{"type":"cook_now|plan_meals|use_saved_recipe|review_pantry","title":"string","detail":"string","priority":"high|medium|low","cta":"find_recipes|open_planner|view_pantry|view_saved_recipes"}]}',
      "Keep predictions to 2-4 items.",
      "Keep suggestions to 3-5 items.",
      "Keep the tone concise, helpful, and action-oriented.",
      `Facts: ${JSON.stringify(input)}`,
    ].join("\n");

    const res = await bedrock.send(
      new ConverseCommand({
        modelId: BEDROCK_MODEL_ID,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { temperature: 0.2, maxTokens: 1200 },
      }),
    );

    const rawText = res.output?.message?.content?.find((x) => "text" in x)?.text ?? "";
    if (!rawText) return fallback;

    const parsed = JSON.parse(stripCodeFence(rawText)) as Partial<SummaryIntelligence>;
    if (!parsed.headline || !parsed.narrative) return fallback;

    return {
      headline: parsed.headline,
      narrative: parsed.narrative,
      predictions: clampPredictions((parsed.predictions ?? []).filter(Boolean) as SummaryPrediction[]),
      suggestions: clampSuggestions((parsed.suggestions ?? []).filter(Boolean) as SummarySuggestion[]),
    };
  } catch (error) {
    console.warn("[summary] Bedrock intelligence fallback:", error);
    return fallback;
  }
}

async function resolveRecipeImage(
  imageS3Key: string | null | undefined,
  fallbackUrl: string | null | undefined,
): Promise<string | null> {
  if (imageS3Key && RECIPE_CACHE_BUCKET) {
    try {
      return await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: RECIPE_CACHE_BUCKET, Key: imageS3Key }),
        { expiresIn: 3600 },
      );
    } catch {
      // fall through to fallback
    }
  }
  return fallbackUrl ?? null;
}

export async function getUserSummary(userId: string) {
  const profileId = await getUserProfileIdBySubject(userId);
  if (!profileId) throw new Error("User not found");

  // Run all three in parallel
  const [pantryItems, cookingActivity, savedRecipesData, tasteProfile] = await Promise.all([
    getPantryItems(userId),
    getCookingHistory(userId),
    prisma.savedRecipe.findMany({
      where: { userId: profileId },
      orderBy: { createdAt: "desc" },
      include: {
        recipe: {
          select: {
            title: true,
            image: true,
            imageSourceUrl: true,
            readyMinutes: true,
            cuisine: true,
          },
        },
      },
    }),
    getUserFeedPreferencesBySubject(userId),
  ]);

  // Pantry health breakdown
  const categoryBreakdown = Object.entries(
    pantryItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([category, count]) => ({ category, count }));

  const pantryHealth = {
    totalItems: pantryItems.length,
    freshCount: pantryItems.filter((i) => i.expiryStatus === "fresh").length,
    expiringCount: pantryItems.filter((i) => i.expiryStatus === "expiring_soon").length,
    expiredCount: pantryItems.filter((i) => i.expiryStatus === "expired").length,
    noDateCount: pantryItems.filter((i) => i.expiryStatus === "no_date").length,
    categoryBreakdown,
  };

  const snapshot: SummarySnapshot = {
    totalPantryItems: pantryHealth.totalItems,
    expiringSoonCount: pantryHealth.expiringCount,
    expiredCount: pantryHealth.expiredCount,
    savedRecipesCount: savedRecipesData.length,
    totalCooked: cookingActivity.totalCooked,
    thisMonthCooked: cookingActivity.thisMonthCooked,
    currentStreak: cookingActivity.currentStreak,
  };

  const expiringSoonItems = pantryItems
    .filter((item) => item.expiryStatus === "expiring_soon")
    .sort((a, b) => (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999))
    .map((item) => ({
      name: item.canonicalName || item.rawName,
      quantity: item.quantity,
      unit: item.unit,
      daysUntilExpiry: item.daysUntilExpiry ?? null,
    }));

  const riskyCategories = Object.entries(
    pantryItems
      .filter((item) => item.expiryStatus === "expiring_soon" || item.expiryStatus === "expired")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 3);

  // Saved recipes
  const savedRecipes = {
    total: savedRecipesData.length,
    recipes: await Promise.all(
      savedRecipesData.map(async (s) => ({
        recipeId: s.recipeId,
        title: s.recipe.title,
        image: await resolveRecipeImage(s.recipe.image, s.recipe.imageSourceUrl),
        readyMinutes: s.recipe.readyMinutes,
        cuisine: s.recipe.cuisine,
        savedAt: s.createdAt,
      })),
    ),
  };

  const intelligence = await generateSummaryIntelligence({
    snapshot,
    pantryHealth,
    expiringSoonItems,
    riskyCategories,
    cookingActivity: {
      totalCooked: cookingActivity.totalCooked,
      thisMonthCooked: cookingActivity.thisMonthCooked,
      currentStreak: cookingActivity.currentStreak,
      recentRecipeTitles: safeList(cookingActivity.recentHistory.map((item) => item.recipeTitle)),
    },
    savedRecipes: {
      total: savedRecipes.total,
      recentTitles: safeList(savedRecipes.recipes.map((item) => item.title)),
    },
    tasteProfile: {
      likes: safeList(tasteProfile?.likes ?? [], 6),
      dislikes: safeList(tasteProfile?.dislikes ?? [], 6),
      dietSignals: safeList(tasteProfile?.dietSignals ?? [], 4),
      allergies: safeList(tasteProfile?.allergies ?? [], 4),
    },
  });

  return {
    snapshot,
    pantryHealth,
    cookingActivity,
    savedRecipes,
    intelligence,
  };
}
