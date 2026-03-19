import { z } from "zod";
import { withAuth } from "../../auth/index.js";
import {
  cookRecipeForUser,
  getRecipeDetails,
  getRecipeSuggestionsForUser,
  toggleSaveRecipe,
  searchRecipes,
  generateAndSaveRecipe,
  generateGroceryPlan,
} from "../index.js";
import { handleError, ok, parseBody, type JsonResponse } from "../../../common/routing/helpers.js";

const recipeSuggestionsSchema = z.object({
  limit: z.number().int().min(1).max(30).optional(),
});

const cookRecipeSchema = z.object({
  servingsUsed: z.number().positive().max(20).optional(),
  dryRun: z.boolean().optional(),
});

const generateRecipeSchema = z.object({
  name: z.string().min(1).max(200),
  targetServings: z.number().int().min(1).max(20).optional(),
});

const groceryPlanSchema = z.object({
  recipes: z.array(
    z.object({
      recipeId: z.number().int(),
      targetServings: z.number().int().min(1).max(20),
    }),
  ).min(1).max(20),
});

export async function handleRecipesRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse | null> {
  if (!path.startsWith("/recipes") && path !== "/me/planner/grocery-list") return null;

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

  if (method === "GET" && path.startsWith("/recipes/search")) {
    return withAuth(authHeader, async (claims) => {
      try {
        const url = new URL(`http://local${path}`);
        const query = url.searchParams.get("q") ?? "";

        if (!query.trim()) {
          return ok({ recipes: [] });
        }

        const recipes = await searchRecipes(query, claims.sub);
        return ok({ recipes });
      } catch (error) {
        return handleError(error, "Failed to search recipes");
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

  if (method === "POST" && path === "/recipes/from-name") {
    return withAuth(authHeader, async () => {
      try {
        const parsed = parseBody(rawBody, generateRecipeSchema);
        const recipe = await generateAndSaveRecipe(
          parsed.name,
          parsed.targetServings ?? 4,
        );
        return ok({ recipe });
      } catch (error) {
        console.error("[from-name] error:", error);
        return handleError(error, "Failed to generate recipe");
      }
    });
  }

  if (method === "POST" && path === "/me/planner/grocery-list") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, groceryPlanSchema);
        const plan = await generateGroceryPlan(
          claims.sub,
          parsed.recipes,
        );
        return ok({ plan });
      } catch (error) {
        console.error("[grocery-list] error:", error);
        return handleError(error, "Failed to generate grocery plan");
      }
    });
  }

  return null;
}
