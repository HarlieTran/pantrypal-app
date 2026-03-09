import { useMemo } from "react";

type Params = {
  isLoggedIn: boolean;
  sub?: string;
  profileDisplayName?: string;
  profileEmail?: string;
};

export function useIdentity({ isLoggedIn, sub, profileDisplayName, profileEmail }: Params) {
  const displayName = useMemo(() => {
    if (profileDisplayName?.trim()) return profileDisplayName.trim();
    return isLoggedIn ? "PantryPal User" : "Guest";
  }, [isLoggedIn, profileDisplayName]);

  const accountId = useMemo(() => {
    if (profileEmail?.trim()) return profileEmail.trim();
    if (isLoggedIn) return "authenticated-user";
    return "guest";
  }, [isLoggedIn, profileEmail]);

  const avatarLabel = useMemo(() => {
    const source = displayName || accountId;
    return (source[0] ?? "P").toUpperCase();
  }, [accountId, displayName]);

  return { displayName, accountId, avatarLabel, sub };
}
