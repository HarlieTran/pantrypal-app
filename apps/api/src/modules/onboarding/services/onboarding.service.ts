import { prisma } from "../../../common/db/prisma.js";
import { getRecipeImageUrl } from "../../../common/storage/s3.js";
import { inferPreferencesFromSelections } from "../../../common/ai/bedrock.js";
import { QUESTION_TYPES } from "@pantrypal/shared-types";
import { getUserBySubject } from "../../users/index.js";

const DEFAULT_RECIPE_IMAGE_URL =
  process.env.DEFAULT_RECIPE_IMAGE_URL ||
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80";

export async function getOnboardingQuestions() {
  return prisma.question.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function saveUserAnswers(
  sub: string,
  answers: Array<{ questionKey: string; optionValues?: string[]; answerText?: string }>,
) {
  const user = await getUserBySubject(sub);
  if (!user) throw new Error("User not found");

  const keys = [...new Set(answers.map((a) => a.questionKey))];
  const questions = await prisma.question.findMany({
    where: { key: { in: keys }, isActive: true },
    include: { options: { where: { isActive: true } } },
  });

  const byKey = new Map(questions.map((q) => [q.key, q]));

  await prisma.$transaction(async (tx) => {
    await tx.userAnswer.deleteMany({
      where: { userId: user.id, question: { key: { in: keys } } },
    });

    for (const item of answers) {
      const q = byKey.get(item.questionKey);
      if (!q) continue;

      if (q.type === QUESTION_TYPES.FREE_TEXT) {
        const text = item.answerText?.trim();
        if (text) {
          await tx.userAnswer.create({
            data: { userId: user.id, questionId: q.id, answerText: text },
          });
        }
        continue;
      }

      const optionValues = (item.optionValues ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean);
      for (const v of optionValues) {
        const opt = q.options.find((o) => o.value === v);
        if (!opt) continue;
        await tx.userAnswer.create({
          data: { userId: user.id, questionId: q.id, optionId: opt.id },
        });
      }
    }
  });

  return { saved: true };
}

export async function markOnboardingComplete(sub: string) {
  const user = await getUserBySubject(sub);
  if (!user) throw new Error("User not found");

  return prisma.userProfile.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });
}

export async function getRandomRecipeImages(count = 6) {
  const safeCount = Math.max(1, Math.min(count, 12));

  const images = await prisma.curatedRecipeImage.findMany({
    where: { isActive: true },
    select: {
      id: true,
      s3Key: true,
      title: true,
      cuisine: true,
      dietTags: true,
      proteinTags: true,
      spiceLevel: true,
      extraTags: true,
      createdAt: true,
    },
  });

  if (images.length === 0) return [];

  const shuffled = [...images];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(safeCount, shuffled.length));

  return Promise.all(
    selected.map(async (img) => {
      const imageUrl = await getRecipeImageUrl(img.s3Key);
      return {
        ...img,
        imageUrl: imageUrl || DEFAULT_RECIPE_IMAGE_URL,
      };
    }),
  );
}

export async function submitRecipeSelections(
  sub: string,
  payload: { selectedImageIds: string[]; rejectedImageIds: string[] },
) {
  const user = await getUserBySubject(sub);
  if (!user) throw new Error("User not found");

  const selectedIds = [...new Set(payload.selectedImageIds)];
  const rejectedIds = [...new Set(payload.rejectedImageIds)];

  const selectedImages = await prisma.curatedRecipeImage.findMany({
    where: { id: { in: selectedIds }, isActive: true },
  });

  const rejectedImages = await prisma.curatedRecipeImage.findMany({
    where: { id: { in: rejectedIds }, isActive: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.userRecipeSelection.deleteMany({ where: { userId: user.id } });

    for (const id of selectedIds) {
      await tx.userRecipeSelection.create({
        data: { userId: user.id, imageId: id, isSelected: true },
      });
    }
    for (const id of rejectedIds) {
      await tx.userRecipeSelection.create({
        data: { userId: user.id, imageId: id, isSelected: false },
      });
    }
  });

  const inference = await inferPreferencesFromSelections({
    selected: selectedImages.map((x) => ({
      title: x.title,
      cuisine: x.cuisine,
      dietTags: x.dietTags,
      proteinTags: x.proteinTags,
      spiceLevel: x.spiceLevel,
      extraTags: x.extraTags,
    })),
    rejected: rejectedImages.map((x) => ({
      title: x.title,
      cuisine: x.cuisine,
      dietTags: x.dietTags,
      proteinTags: x.proteinTags,
      spiceLevel: x.spiceLevel,
      extraTags: x.extraTags,
    })),
  });

  const preferenceProfile = await prisma.userPreferenceProfile.upsert({
    where: { userId: user.id },
    update: {
      likes: inference.likes,
      dislikes: inference.dislikes,
      dietSignals: inference.dietSignals,
      confidence: inference.confidence,
      rawModelOutput: inference,
    },
    create: {
      userId: user.id,
      likes: inference.likes,
      dislikes: inference.dislikes,
      dietSignals: inference.dietSignals,
      confidence: inference.confidence,
      rawModelOutput: inference,
    },
  });

  await prisma.userProfile.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  return preferenceProfile;
}
