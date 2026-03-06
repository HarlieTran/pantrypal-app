import { useEffect, useState } from "react";
import type { SessionState } from "./session.types";
import { CognitoUser } from "amazon-cognito-identity-js";
import { getPool } from "../../modules/auth/infra/cognito.pool";

export function useSessionBootstrap(): SessionState {
  const [session, setSession] = useState<SessionState>({ status: "bootstrapping" });

  useEffect(() => {
    const pool = getPool();

    // Check if Cognito has a cached user in localStorage
    const cognitoUser = pool.getCurrentUser();

    if (!cognitoUser) {
      // No cached user at all — definitely a guest
      setSession({ status: "guest" });
      return;
    }

    // There is a cached user — attempt silent session refresh
    cognitoUser.getSession((err: Error | null, result: any) => {
      if (err || !result || !result.isValid()) {
        // Refresh failed or session invalid — treat as guest
        setSession({ status: "guest" });
        return;
      }

      // Valid session — extract what we need
      const token = result.getIdToken().getJwtToken();
      const payload = result.getIdToken().decodePayload();

      setSession({
        status: "authenticated",
        token,
        userId: payload.sub,
        email: payload.email ?? "",
      });
    });
  }, []); // runs once on mount

  return session;
}