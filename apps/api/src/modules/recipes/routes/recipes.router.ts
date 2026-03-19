import { z } from "zod";
import { withAuth } from "../../auth/index.js";
import {
  cookRecipeForUser,
  getRecipeDetails,
  getRecipeSuggestionsForUser,
  toggleSaveRecipe,
} from "../index.js";
import { handleError, ok, parseBody, type JsonResponse } from "../../../common/routing/helpers.js";

const recipeSuggestionsSchema = z.object({
  limit: z.number().int().min(1).max(30).optional(),
});

const cookRecipeSchema = z.object({
  servingsUsed: z.number().positive().max(20).optional(),
  dryRun: z.boolean().optional(),
});

export async function handleRecipesRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse | null> {
  if (!path.startsWith("/recipes")) return null;

  if (method === "POST" && path === "/recipes/suggestions") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, recipeSuggestionsSchema);
        const data = await getRecipeSuggestionsForUser(claims.sub, parsed.limit ?? 12);
        return ok(data);
      } catch (error) {
        return handleError(error, "Failed to generate recipe suggestions");
      }
    });
  }

  if (method === "GET" && path.match(/^\/recipes\/\d+$/)) {
    return withAuth(authHeader, async () => {
      try {
        const id = Number(path.split("/")[2]);
        const recipe = await getRecipeDetails(id);
        return ok({ recipe });
      } catch (error) {
        return handleError(error, "Failed to fetch recipe details");
      }
    });
  }

  if (method === "POST" && path.match(/^\/recipes\/\d+\/cook$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const recipeId = Number(path.split("/")[2]);
        const parsed = parseBody(rawBody, cookRecipeSchema);
        const result = await cookRecipeForUser(claims.sub, recipeId, {
          servingsUsed: parsed.servingsUsed ?? 1,
          dryRun: parsed.dryRun ?? false,
        });
        return ok(result);
      } catch (error) {
        return handleError(error, "Failed to apply recipe to pantry");
      }
    });
  }

  if (method === "POST" && path.match(/^\/recipes\/\d+\/save$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const recipeId = Number(path.split("/")[2]);
        const result = await toggleSaveRecipe(claims.sub, recipeId);
        return ok(result);
      } catch (error) {
        return handleError(error, "Failed to toggle save");
      }
    });
  }

  return null;
}
