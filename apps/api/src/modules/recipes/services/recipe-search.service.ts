import { prisma } from "../../../common/db/prisma.js";
import { getUserProfileIdBySubject } from "../../users/index.js";
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
      // fall through
    }
  }
  return fallbackUrl ?? null;
}

export type RecipeSearchResult = {
  id: number;
  title: string;
  image: string | null;
  cuisine: string[];
  dietTags: string[];
  readyMinutes: number | null;
  servings: number | null;
  isSaved: boolean;
  matchedIngredientCount: number;
  totalIngredientCount: number;
  isPantryReady: boolean;
};

export async function searchRecipes(
  query: string,
  userId: string,
): Promise<RecipeSearchResult[]> {
  const profileId = await getUserProfileIdBySubject(userId);

  // Find saved recipe IDs for this user
  const savedRecipeIds = profileId
    ? await prisma.savedRecipe
        .findMany({
          where: { userId: profileId },
          select: { recipeId: true },
        })
        .then((rows) => new Set(rows.map((r) => r.recipeId)))
    : new Set<number>();

  // Search recipes table by title
  const recipes = await prisma.recipe.findMany({
    where: {
      title: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      title: true,
      image: true,
      imageSourceUrl: true,
      cuisine: true,
      dietTags: true,
      readyMinutes: true,
      servings: true,
      ingredients: {
        select: { canonicalName: true },
      },
    },
    take: 10,
    orderBy: { title: "asc" },
  });

  // Load current pantry items for pantry-ready calculation
  const pantryItems = profileId
    ? await prisma.pantryItem.findMany({
        where: { userProfileId: profileId },
        select: { canonicalName: true },
      })
    : [];

  const pantrySet = new Set(
    pantryItems.map((i) => i.canonicalName.trim().toLowerCase()),
  );

  // Build results
  const results = await Promise.all(
    recipes.map(async (r) => {
      const total = r.ingredients.length;
      const matched = r.ingredients.filter((i) =>
        pantrySet.has(i.canonicalName.trim().toLowerCase()),
      ).length;
      const matchRatio = total > 0 ? matched / total : 0;

      return {
        id: r.id,
        title: r.title,
        image: await resolveRecipeImage(r.image, r.imageSourceUrl),
        cuisine: r.cuisine,
        dietTags: r.dietTags,
        readyMinutes: r.readyMinutes,
        servings: r.servings,
        isSaved: savedRecipeIds.has(r.id),
        matchedIngredientCount: matched,
        totalIngredientCount: total,
        isPantryReady: matchRatio >= 0.8,
      };
    }),
  );

  // Sort: saved first, then pantry-ready, then alphabetical
  return results.sort((a, b) => {
    if (a.isSaved !== b.isSaved) return a.isSaved ? -1 : 1;
    if (a.isPantryReady !== b.isPantryReady) return a.isPantryReady ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}