import { z } from "zod";
import { requireAuth } from "../../auth/index.js";
import {
  bootstrapUser,
  getMeBySubject,
  getOnboardingQuestions,
  getUserProfile,
  markOnboardingComplete,
  saveUserAnswers,
} from "../../users/index.js";
import { getRandomRecipeImages } from "../../users/index.js";
import { submitRecipeSelections } from "../../users/index.js";
import { getOrCreateDailySpecial } from "../../home/index.js";

import {
  getPantryItems,
  getPantryMeta,
  addPantryItem,
  addPantryItemsBulk,
  updatePantryItem,
  deletePantryItem,
  getPantryImageUploadUrl,
  parseImageForIngredients,
} from "../../pantry/index.js";

import { cookRecipeForUser, getRecipeSuggestionsForUser, getRecipeDetails } from "../../recipes/index.js";


// Add Zod schemas

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

const addPantryItemSchema = z.object({
  rawName: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

const updatePantryItemSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(50).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

const bulkAddPantrySchema = z.object({
  items: z.array(addPantryItemSchema).min(1).max(50),
});

const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

const parseImageSchema = z.object({
  imageKey: z.string().min(1),
});

const recipeSuggestionsSchema = z.object({
  limit: z.number().int().min(1).max(30).optional(),
});

const cookRecipeSchema = z.object({
  servingsUsed: z.number().positive().max(20).optional(),
  dryRun: z.boolean().optional(),
});



// Handle API Route
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

  // GET /pantry
  if (method === "GET" && path === "/pantry") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const [items, meta] = await Promise.all([
        getPantryItems(claims.sub),
        getPantryMeta(claims.sub),
      ]);
      return { statusCode: 200, body: { items, meta } };
    } catch {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  // POST /pantry/items
  if (method === "POST" && path === "/pantry/items") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const parsed = addPantryItemSchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const item = await addPantryItem(claims.sub, parsed);
      return { statusCode: 201, body: { item } };
    } catch (error) {
      if (error instanceof z.ZodError)
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  // POST /pantry/items/bulk
  if (method === "POST" && path === "/pantry/items/bulk") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const parsed = bulkAddPantrySchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const items = await addPantryItemsBulk(claims.sub, parsed.items);
      return { statusCode: 201, body: { items } };
    } catch (error) {
      if (error instanceof z.ZodError)
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  // PATCH /pantry/items/:itemId
  if (method === "PATCH" && path.match(/^\/pantry\/items\/[^/]+$/)) {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const itemId = path.split("/")[3];
      const parsed = updatePantryItemSchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const item = await updatePantryItem(claims.sub, itemId, parsed);
      return { statusCode: 200, body: { item } };
    } catch (error) {
      if (error instanceof z.ZodError)
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  // DELETE /pantry/items/:itemId
  if (method === "DELETE" && path.match(/^\/pantry\/items\/[^/]+$/)) {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const itemId = path.split("/")[3];
      await deletePantryItem(claims.sub, itemId);
      return { statusCode: 200, body: { deleted: true } };
    } catch {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  // POST /pantry/upload-url
  if (method === "POST" && path === "/pantry/upload-url") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const parsed = uploadUrlSchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const result = await getPantryImageUploadUrl(
        claims.sub,
        parsed.filename,
        parsed.contentType,
      );
      return { statusCode: 200, body: result };
    } catch (error) {
      if (error instanceof z.ZodError)
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
  }

  // POST /pantry/parse-image
  if (method === "POST" && path === "/pantry/parse-image") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      void claims;
      const parsed = parseImageSchema.parse(rawBody ? JSON.parse(rawBody) : {});
      const ingredients = await parseImageForIngredients(parsed.imageKey);
      return { statusCode: 200, body: { ingredients } };
    } catch (error) {
      if (error instanceof z.ZodError)
        return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
      console.error("parse image error:", error);
      return { statusCode: 500, body: { error: "Failed to parse image" } };
    }
  }

  // POST /recipes/suggestions
if (method === "POST" && path === "/recipes/suggestions") {
  try {
    const claims = await requireAuth({ headers: { authorization: authHeader } });
    const parsed = recipeSuggestionsSchema.parse(rawBody ? JSON.parse(rawBody) : {});
    const data = await getRecipeSuggestionsForUser(claims.sub, parsed.limit ?? 12);
    return { statusCode: 200, body: data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
    }
    console.error("recipe suggestions error:", error);
    return { statusCode: 500, body: { error: "Failed to generate recipe suggestions" } };
  }
}

// GET /recipes/:id
if (method === "GET" && path.match(/^\/recipes\/\d+$/)) {
  try {
    await requireAuth({ headers: { authorization: authHeader } });
    const id = Number(path.split("/")[2]);
    const recipe = await getRecipeDetails(id);
    return { statusCode: 200, body: { recipe } };
  } catch (error) {
    console.error("recipe details error:", error);
    return { statusCode: 500, body: { error: "Failed to fetch recipe details" } };
  }
}

if (method === "POST" && path.match(/^\/recipes\/\d+\/cook$/)) {
  try {
    const claims = await requireAuth({ headers: { authorization: authHeader } });
    const recipeId = Number(path.split("/")[2]);
    const parsed = cookRecipeSchema.parse(rawBody ? JSON.parse(rawBody) : {});
    const result = await cookRecipeForUser(claims.sub, recipeId, {
      servingsUsed: parsed.servingsUsed ?? 1,
      dryRun: parsed.dryRun ?? false,
    });
    return { statusCode: 200, body: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
    }
    console.error("cook recipe error:", error);
    return { statusCode: 500, body: { error: "Failed to apply recipe to pantry" } };
  }
}

if (method === "GET" && path === "/me/profile") {
    try {
      const claims = await requireAuth({ headers: { authorization: authHeader } });
      const profile = await getUserProfile(claims.sub);
      return { statusCode: 200, body: { profile } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("not found") || msg.toLowerCase().includes("unauthorized")) {
        return { statusCode: 401, body: { error: "Unauthorized" } };
      }
      console.error("profile error:", err);
      return { statusCode: 500, body: { error: "Failed to load profile" } };
    }
  }

  return { statusCode: 404, body: { error: "Not found" } };
}


