import { z } from "zod";
import { withAuth } from "../../auth/index.js";
import {
  getOnboardingQuestions,
  getRandomRecipeImages,
  markOnboardingComplete,
  saveUserAnswers,
  submitRecipeSelections,
} from "../index.js";
import { created, handleError, ok, parseBody, serverError, type JsonResponse } from "../../../common/routing/helpers.js";

const answersSchema = z.object({
  answers: z.array(
    z.object({
      questionKey: z.string().min(1),
      optionValues: z.array(z.string()).optional(),
      answerText: z.string().max(500).optional(),
    }),
  ),
});

const recipeSelectionSchema = z.object({
  selectedImageIds: z.array(z.string().min(1)).min(1),
  rejectedImageIds: z.array(z.string().min(1)),
});

export async function handleOnboardingRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse | null> {
  if (method === "GET" && path === "/onboarding/questions") {
    const questions = await getOnboardingQuestions();
    return ok({ questions });
  }

  if (method === "PUT" && path === "/me/answers") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, answersSchema);
        const result = await saveUserAnswers(claims.sub, parsed.answers);
        return ok(result);
      } catch (error) {
        return handleError(error, "Failed to save answers");
      }
    });
  }

  if (method === "POST" && path === "/me/onboarding/complete") {
    return withAuth(authHeader, async (claims) => {
      try {
        const profile = await markOnboardingComplete(claims.sub);
        return ok({ profile });
      } catch (error) {
        return handleError(error, "Failed to complete onboarding");
      }
    });
  }

  if (method === "GET" && path.startsWith("/onboarding/recipe-images")) {
    try {
      const url = new URL(`http://local${path}`);
      const countParam = Number(url.searchParams.get("count") || "6");
      const images = await getRandomRecipeImages(Number.isFinite(countParam) ? countParam : 6);
      return ok({ images });
    } catch (error) {
      return serverError("Failed to load recipe images");
    }
  }

  if (method === "POST" && path === "/me/onboarding/recipe-selections") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, recipeSelectionSchema);
        const preferenceProfile = await submitRecipeSelections(claims.sub, parsed);
        return created({ preferenceProfile });
      } catch (error) {
        return handleError(error, "Server error");
      }
    });
  }

  return null;
}
