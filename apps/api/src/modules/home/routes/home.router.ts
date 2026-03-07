import { getOrCreateDailySpecial } from "../index.js";
import { ok, serverError, unauthorized, type JsonResponse } from "../../../common/routing/helpers.js";

export async function handleHomeRoute(
  method: string,
  path: string,
  authHeader?: string,
): Promise<JsonResponse | null> {
  if (method === "GET" && path === "/home") {
    try {
      const todaySpecial = await getOrCreateDailySpecial("global");
      return ok({
        todaySpecial,
        navigation: {
          pantryPath: "/pantry",
          communityPath: "/community",
        },
      });
    } catch (error) {
      return serverError("Server error");
    }
  }

  if (method === "POST" && path === "/internal/home/prewarm") {
    const key = authHeader?.replace("Bearer ", "") || "";
    if (!process.env.INTERNAL_WORKER_KEY || key !== process.env.INTERNAL_WORKER_KEY) {
      return unauthorized();
    }

    const todaySpecial = await getOrCreateDailySpecial("global");
    return ok({ todaySpecial });
  }

  return null;
}
