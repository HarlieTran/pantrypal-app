import { requireAuth } from "./auth.middleware.js";
import type { AuthClaims } from "../../../common/auth/jwt.js";

type JsonResponse = { statusCode: number; body: Record<string, unknown> };

type AuthedHandler = (claims: AuthClaims) => Promise<JsonResponse>;

export async function withAuth(
  authHeader: string | undefined,
  handler: AuthedHandler,
): Promise<JsonResponse> {
  try {
    const claims = await requireAuth({ headers: { authorization: authHeader } });
    return handler(claims);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unauthorized")) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }
    throw error;
  }
}
