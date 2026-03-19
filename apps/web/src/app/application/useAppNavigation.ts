import { useState, useEffect } from "react";
import { getMe, submitRecipeSelections } from "../../modules/onboarding";
import type { PreferenceProfile } from "../../modules/home";
import type { RightPanel } from "../App";

type View = "home" | "onboarding" | "onboarding-recipe-picks" | "pantry" | "recipes" | "profile" | "edit-profile" | "community" | "summary";

export function useAppNavigation(sessionStatus: string, token: string) {
  const [view, setView] = useState<View>("community");
  const [rightPanel, setRightPanel] = useState<RightPanel>("guest");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile | null>(null);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      void (async () => {
        try {
          const meResponse = await getMe(token);
          const me = meResponse?.me;
          setOnboardingCompleted(me?.onboardingCompleted ?? false);
          setRightPanel("user");
        } catch {
          setRightPanel("user");
        }
      })();
    }
  }, [sessionStatus, token]);

  const handlePicksComplete = async (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => {
    const res = await submitRecipeSelections(token, payload);
    const profile = res?.preferenceProfile;
    setPreferenceProfile({
      likes: Array.isArray(profile?.likes) ? profile.likes : [],
      dislikes: Array.isArray(profile?.dislikes) ? profile.dislikes : [],
      dietSignals: Array.isArray(profile?.dietSignals) ? profile.dietSignals : [],
      confidence: {
        likes: Number(profile?.confidence?.likes ?? 0),
        dislikes: Number(profile?.confidence?.dislikes ?? 0),
        overall: Number(profile?.confidence?.overall ?? 0),
      },
    });
    setOnboardingCompleted(true);
    setView("home");
    setRightPanel("user");
  };

  const resetOnLogout = () => {
    setPreferenceProfile(null);
    setRightPanel("guest");
    setView("home");
    setOnboardingCompleted(false);
  };

  return {
    view,
    setView,
    rightPanel,
    setRightPanel,
    onboardingCompleted,
    setOnboardingCompleted,
    preferenceProfile,
    handlePicksComplete,
    resetOnLogout,
  };
}
