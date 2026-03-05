import { prisma } from "../../../common/db/prisma.js";

const AUTH_PROVIDER = "cognito";

type UpdateUserProfileInput = {
  displayName?: string;
  likes?: string;
  dietType?: string[];
  allergies?: string[];
  disliked?: string;
  notes?: string;
};

function toOptionValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

type QuestionWithOptions = {
  id: string;
  key: string;
  label: string;
  options: Array<{ id: string; value: string }>;
};

function pickQuestion(
  questions: QuestionWithOptions[],
  keys: string[],
  labelIncludes: string[],
) {
  return questions.find((q) => keys.includes(q.key))
    ?? questions.find((q) =>
      labelIncludes.some((term) => q.label.toLowerCase().includes(term.toLowerCase())),
    );
}

export async function getUserProfile(sub: string) {
  const user = await prisma.userProfile.findUnique({
    where: { authProvider_authSubject: { authProvider: AUTH_PROVIDER, authSubject: sub } },
    include: {
      preferenceProfile: true,
      answers: {
        include: {
          question: { select: { key: true, label: true, type: true } },
          option: { select: { label: true, value: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
    preferenceProfile: user.preferenceProfile
      ? {
          likes: user.preferenceProfile.likes as string[],
          dislikes: user.preferenceProfile.dislikes as string[],
          dietSignals: user.preferenceProfile.dietSignals as string[],
          confidence: user.preferenceProfile.confidence as {
            likes: number;
            dislikes: number;
            overall: number;
          },
        }
      : null,
    answers: user.answers.map((a) => ({
      question: a.question,
      option: a.option ?? null,
      answerText: a.answerText ?? null,
    })),
  };
}

export async function updateUserProfile(sub: string, payload: UpdateUserProfileInput) {
  const user = await prisma.userProfile.findUnique({
    where: { authProvider_authSubject: { authProvider: AUTH_PROVIDER, authSubject: sub } },
    select: { id: true, preferenceProfile: { select: { id: true } } },
  });

  if (!user) throw new Error("User not found");

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    include: { options: true },
  });

  const dietQuestion = pickQuestion(questions, ["diet"], ["diet"]);
  const allergyQuestion = pickQuestion(questions, ["allergies"], ["allerg"]);
  const dislikedQuestion = pickQuestion(questions, ["disliked_ingredients"], ["disliked"]);
  const notesQuestion = pickQuestion(questions, ["diet_notes"], ["diet notes"]);

  await prisma.$transaction(async (tx) => {
    if (typeof payload.displayName === "string") {
      await tx.userProfile.update({
        where: { id: user.id },
        data: { displayName: payload.displayName.trim() || null },
      });
    }

    if (dietQuestion && Array.isArray(payload.dietType)) {
      await tx.userAnswer.deleteMany({
        where: { userId: user.id, questionId: dietQuestion.id },
      });

      const normalized = payload.dietType.map(toOptionValue);
      const selected = dietQuestion.options.filter((o) => normalized.includes(o.value));
      if (selected.length) {
        await tx.userAnswer.createMany({
          data: selected.map((o) => ({
            userId: user.id,
            questionId: dietQuestion.id,
            optionId: o.id,
          })),
        });
      }
    }

    if (allergyQuestion && Array.isArray(payload.allergies)) {
      await tx.userAnswer.deleteMany({
        where: { userId: user.id, questionId: allergyQuestion.id },
      });

      const normalized = payload.allergies.map(toOptionValue);
      const selected = allergyQuestion.options.filter((o) => normalized.includes(o.value));
      if (selected.length) {
        await tx.userAnswer.createMany({
          data: selected.map((o) => ({
            userId: user.id,
            questionId: allergyQuestion.id,
            optionId: o.id,
          })),
        });
      }
    }

    if (dislikedQuestion && typeof payload.disliked === "string") {
      await tx.userAnswer.deleteMany({
        where: { userId: user.id, questionId: dislikedQuestion.id },
      });

      const text = payload.disliked.trim();
      if (text) {
        await tx.userAnswer.create({
          data: {
            userId: user.id,
            questionId: dislikedQuestion.id,
            answerText: text,
          },
        });
      }
    }

    if (notesQuestion && typeof payload.notes === "string") {
      await tx.userAnswer.deleteMany({
        where: { userId: user.id, questionId: notesQuestion.id },
      });

      const text = payload.notes.trim();
      if (text) {
        await tx.userAnswer.create({
          data: {
            userId: user.id,
            questionId: notesQuestion.id,
            answerText: text,
          },
        });
      }
    }

    if (
      user.preferenceProfile?.id
      && (payload.likes !== undefined || payload.disliked !== undefined || payload.dietType !== undefined)
    ) {
      await tx.userPreferenceProfile.update({
        where: { id: user.preferenceProfile.id },
        data: {
          ...(payload.likes !== undefined ? { likes: splitCsv(payload.likes) } : {}),
          ...(payload.disliked !== undefined ? { dislikes: splitCsv(payload.disliked) } : {}),
          ...(payload.dietType !== undefined ? { dietSignals: payload.dietType } : {}),
        },
      });
    }
  });

  return getUserProfile(sub);
}
