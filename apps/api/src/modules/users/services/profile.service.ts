import { prisma } from "../../../common/db/prisma.js";

const AUTH_PROVIDER = "cognito";

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