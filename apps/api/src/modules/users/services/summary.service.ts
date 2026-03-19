import { prisma } from "../../../common/db/prisma.js";
import { getUserProfileIdBySubject } from "./profile.service.js";
import { getPantryItems } from "../../pantry/index.js";
import { getCookingHistory } from "../../recipes/index.js";

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
    recipes: savedRecipesData.map((s) => ({
      recipeId: s.recipeId,
      title: s.recipe.title,
      image: s.recipe.image ?? s.recipe.imageSourceUrl ?? null,
      readyMinutes: s.recipe.readyMinutes,
      cuisine: s.recipe.cuisine,
      savedAt: s.createdAt,
    })),
  };

  return {
    pantryHealth,
    cookingActivity,
    savedRecipes,
  };
}