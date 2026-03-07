import { normalizePathname } from "../../../common/routing/helpers.js";
import { handleOnboardingRoute } from "../../onboarding/index.js";
import { handlePantryRoute } from "../../pantry/index.js";
import { handleRecipesRoute } from "../../recipes/index.js";
import { handleUsersRoute } from "../../users/index.js";
import { handleHomeRoute } from "../../home/index.js";
import { handleCommunityRoute } from "../../community/index.js";

export type JsonResponse = { statusCode: number; body: Record<string, unknown> };

export async function dispatchApiRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse> {
  try {
    const pathname = normalizePathname(path);

    if (method === "GET" && pathname === "/health") {
      return { statusCode: 200, body: { ok: true, service: "api" } };
    }

    const usersRoutePaths = new Set(["/me", "/me/bootstrap", "/me/profile"]);
    if (usersRoutePaths.has(pathname)) {
      const response = await handleUsersRoute(method, pathname, authHeader, rawBody);
      if (response) return response;
    }

    const isOnboardingPath =
      pathname.startsWith("/onboarding")
      || pathname === "/me/answers"
      || pathname.startsWith("/me/onboarding");
    if (isOnboardingPath) {
      const response = await handleOnboardingRoute(method, path, authHeader, rawBody);
      if (response) return response;
    }

    if (pathname.startsWith("/pantry")) {
      const response = await handlePantryRoute(method, pathname, authHeader, rawBody);
      if (response) return response;
    }

    if (pathname.startsWith("/recipes")) {
      const response = await handleRecipesRoute(method, pathname, authHeader, rawBody);
      if (response) return response;
    }

    if (pathname.startsWith("/community")) {
      const response = await handleCommunityRoute(method, path, authHeader, rawBody);
      if (response) return response;
    }

    if (pathname === "/home" || pathname.startsWith("/internal/home/")) {
      const response = await handleHomeRoute(method, pathname, authHeader);
      if (response) return response;
    }

    return { statusCode: 404, body: { error: "Not found" } };
  } catch (error) {
    console.error("api dispatch error:", error);
    return { statusCode: 500, body: { error: "Server error" } };
  }
}
