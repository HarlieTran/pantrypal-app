import { useEffect, useState } from "react";
import { fetchProfile } from "../infra/profile.api";
import type { UserProfile } from "../model/profile.types";

export function useProfilePageData(token: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const nextProfile = await fetchProfile(token);
        setProfile(nextProfile);
      } catch (e) {
        setError(String((e as Error).message || "Failed to load profile."));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return { profile, loading, error };
}
