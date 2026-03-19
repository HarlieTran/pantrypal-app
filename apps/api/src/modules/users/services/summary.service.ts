import { prisma } from "../../../common/db/prisma.js";
import { getUserProfileIdBySubject } from "./profile.service.js";
import { getPantryItems } from "../../pantry/index.js";
import { getCookingHistory } from "../../recipes/index.js";
import { s3 } from "../../../common/storage/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const RECIPE_CACHE_BUCKET = process.env.S3_BUCKET_RECIPE_CACHE || "";

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
  const [pantryItems, cookingActivity, savedRecipesData] = await Promise.all([
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

  return {
    pantryHealth,
    cookingActivity,
    savedRecipes,
  };
}