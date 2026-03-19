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

export async function recordCookingHistory(
  userId: string,
  recipeId: number,
): Promise<void> {
  const profileId = await getUserProfileIdBySubject(userId);
  if (!profileId) return;

  await prisma.cookingHistory.create({
    data: { userId: profileId, recipeId },
  });
}

export async function getCookingHistory(userId: string): Promise<{
  totalCooked: number;
  thisMonthCooked: number;
  currentStreak: number;
  recentHistory: Array<{
    id: string;
    recipeId: number;
    recipeTitle: string;
    recipeImage: string | null;
    cookedAt: Date;
  }>;
}> {
  const profileId = await getUserProfileIdBySubject(userId);
  if (!profileId) {
    return { totalCooked: 0, thisMonthCooked: 0, currentStreak: 0, recentHistory: [] };
  }

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [totalCooked, thisMonthCooked, recentHistory] = await Promise.all([
    prisma.cookingHistory.count({
      where: { userId: profileId },
    }),
    prisma.cookingHistory.count({
      where: { userId: profileId, createdAt: { gte: startOfMonth } },
    }),
    prisma.cookingHistory.findMany({
      where: { userId: profileId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        recipe: { select: { title: true, image: true, imageSourceUrl: true } },
      },
    }),
  ]);

  // Calculate streak — consecutive calendar days with at least one cook
  const allCooks = await prisma.cookingHistory.findMany({
    where: { userId: profileId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const cookedDays = new Set(
    allCooks.map((c) => c.createdAt.toISOString().slice(0, 10)),
  );

  let currentStreak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!cookedDays.has(dateStr)) break;
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    totalCooked,
    thisMonthCooked,
    currentStreak,
    recentHistory: await Promise.all(
  recentHistory.map(async (h) => ({
    id: h.id,
    recipeId: h.recipeId,
    recipeTitle: h.recipe.title,
    recipeImage: await resolveRecipeImage(h.recipe.image, h.recipe.imageSourceUrl),
    cookedAt: h.createdAt,
    })),
    ),
  };
}