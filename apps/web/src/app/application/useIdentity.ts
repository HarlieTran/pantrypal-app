import { useMemo } from "react";

type Params = {
  email: string;
  givenName: string;
  familyName: string;
  isLoggedIn: boolean;
  sub?: string;
};

export function useIdentity({ email, givenName, familyName, isLoggedIn, sub }: Params) {
  const displayName = useMemo(() => {
    const full = `${givenName} ${familyName}`.trim();
    if (full) return full;
    if (email.includes("@")) return email.split("@")[0];
    return isLoggedIn ? "PantryPal User" : "Guest";
  }, [email, familyName, givenName, isLoggedIn]);

  const accountId = useMemo(() => {
    if (email.trim()) return email.trim();
    if (isLoggedIn) return "authenticated-user";
    return "guest";
  }, [email, isLoggedIn]);

  const avatarLabel = useMemo(() => {
    const source = displayName || accountId;
    return (source[0] ?? "P").toUpperCase();
  }, [accountId, displayName]);

  return { displayName, accountId, avatarLabel, sub };
}
