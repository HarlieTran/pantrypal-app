import { z } from "zod";
import { requireAuth } from "../modules/auth/auth.middleware.js";
import {
  bootstrapUser,
  getMeBySubject,
  getOnboardingQuestions,
  markOnboardingComplete,
  saveUserAnswers,
} from "../modules/users/users.service.js";
import { getRandomRecipeImages } from "../modules/users/users.service.js";
import { submitRecipeSelections } from "../modules/users/users.service.js";
import { getOrCreateDailySpecial } from "../modules/home/home.service.js";




export type JsonResponse = { statusCode: number; body: Record<string, unknown> };

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


export async function handleApiRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse> {
  if (method === "GET" && path === "/health") return { statusCode: 200, body: { ok: true, service: "api" } };

  if (method === "POST" && path === "/me/bootstrap") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const profile = await bootstrapUser(claims);
      return { statusCode: 200, body: { profile } };
    } catch {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  if (method === "GET" && path === "/me") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const me = await getMeBySubject(claims.sub);
      return { statusCode: 200, body: { me } };
    } catch {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  if (method === "GET" && path === "/onboarding/questions") {
    const questions = await getOnboardingQuestions();
    return { statusCode: 200, body: { questions } };
  }

  if (method === "PUT" && path === "/me/answers") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const parsed = answersSchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const result = await saveUserAnswers(claims.sub, parsed.answers);
      return { statusCode: 200, body: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      }
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  if (method === "POST" && path === "/me/onboarding/complete") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const profile = await markOnboardingComplete(claims.sub);
      return { statusCode: 200, body: { profile } };
    } catch {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  if (method === "GET" && path.startsWith("/onboarding/recipe-images")) {
    try {
      const url = new URL(`http://local${path}`);
      const countParam = Number(url.searchParams.get("count") || "6");
      const images = await getRandomRecipeImages(Number.isFinite(countParam) ? countParam : 6);
      return { statusCode: 200, body: { images } };
    } catch (error) {
    console.error("recipe image fetch error:", error);
    return { statusCode: 500, body: { error: "Failed to load recipe images" } };
    }
  }

  if (method === "POST" && path === "/me/onboarding/recipe-selections") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const parsed = recipeSelectionSchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const preferenceProfile = await submitRecipeSelections(claims.sub, parsed);
      return { statusCode: 200, body: { preferenceProfile } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      }
    
      console.error("recipe selection error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      const isAuth = msg.includes("Unauthorized") || msg.includes("token") || msg.includes("JWT");
      return {
        statusCode: isAuth ? 401 : 500,
        body: { error: isAuth ? "Unauthorized" : "Server error" },
      };
    }
  }

  if (method === "GET" && path === "/home") {
    try {
      const todaySpecial = await getOrCreateDailySpecial("global");
      return {
        statusCode: 200,
        body: {
          todaySpecial,
          navigation: {
            pantryPath: "/pantry",
            communityPath: "/community",
          },
        },
      };
    } catch (error) {
      console.error("home error:", error);
      return { statusCode: 500, body: { error: "Server error" } };
    }
  }

  if (method === "POST" && path === "/internal/home/prewarm") {
    const key = authHeader?.replace("Bearer ", "") || "";
    if (!process.env.INTERNAL_WORKER_KEY || key !== process.env.INTERNAL_WORKER_KEY) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    const todaySpecial = await getOrCreateDailySpecial("global");
    return { statusCode: 200, body: { todaySpecial } };
  }


  return { statusCode: 404, body: { error: "Not found" } };
}
