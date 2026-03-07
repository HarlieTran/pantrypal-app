import type { AuthClaims } from "../../../common/auth/jwt.js";
import {
  getUserBySubject,
  upsertUserProfileFromClaims,
} from "./profile.service.js";

export async function bootstrapUser(claims: AuthClaims) {
  return upsertUserProfileFromClaims(claims);
}

export async function getMeBySubject(sub: string) {
  return getUserBySubject(sub);
}
