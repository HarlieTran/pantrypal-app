import { useMemo } from "react";

type Params = {
  email: string;
  givenName: string;
  familyName: string;
  isLoggedIn: boolean;
  sub?: string;
  profileDisplayName?: string;
  profileEmail?: string;
};

export function useIdentity({ email, givenName, familyName, isLoggedIn, sub, profileDisplayName, profileEmail }: Params) {
  const displayName = useMemo(() => {
    if (profileDisplayName?.trim()) return profileDisplayName.trim();
    const full = `${givenName} ${familyName}`.trim();
    if (full) return full;
    if (email.includes("@")) return email.split("@")[0];
    return isLoggedIn ? "PantryPal User" : "Guest";
  }, [email, familyName, givenName, isLoggedIn, profileDisplayName]);

  const accountId = useMemo(() => {
    if (profileEmail?.trim()) return profileEmail.trim();
    if (email.trim()) return email.trim();
    if (isLoggedIn) return "authenticated-user";
    return "guest";
  }, [email, isLoggedIn, profileEmail]);

  const avatarLabel = useMemo(() => {
    const source = displayName || accountId;
    return (source[0] ?? "P").toUpperCase();
  }, [accountId, displayName]);

  return { displayName, accountId, avatarLabel, sub };
}
