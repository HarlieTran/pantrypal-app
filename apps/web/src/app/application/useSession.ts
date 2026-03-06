import { useState } from "react";
import { useSessionBootstrap } from "./useSessionBootstrap";
import { signOut } from "../../modules/auth";
import type { SessionState } from "./session.types";

export function useSession() {
  const bootstrappedSession = useSessionBootstrap();
  const [overrideSession, setOverrideSession] = useState<SessionState | null>(null);

  // If we have a manual override (post-login or post-logout), use that
  // Otherwise fall back to what bootstrap detected
  const session = overrideSession ?? bootstrappedSession;

  function login(token: string, userId: string, email: string) {
    setOverrideSession({
      status: "authenticated",
      token,
      userId,
      email,
    });
  }

  function logout() {
    signOut();
    setOverrideSession({ status: "guest" });
  }

  return {
    session,
    login,
    logout,
  };
}
