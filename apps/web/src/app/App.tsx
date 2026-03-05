import { useEffect, useMemo, useState } from "react";
import { confirmSignUp, resendCode, signIn, signUp } from "../features/auth";
import { getMe } from "../features/onboarding";
import { OnboardingQuestionnaire } from "../features/onboarding";
import { RecipePreferencePicker } from "../features/onboarding";
import { submitRecipeSelections } from "../features/onboarding";
import { HomePage } from "../features/home";
import type { HomeSpecial, PreferenceProfile } from "../features/home";
import { fetchPantry } from "../features/pantry/api/pantry.api";
import type { PantryItem } from "../features/pantry/model/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";
const DEFAULT_SPECIAL_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2600&q=95";

type View = "home" | "onboarding" | "onboarding-recipe-picks" | "pantry" | "recipes" | "profile";

// Right panel state machine — all auth lives here
export type RightPanel = "guest" | "login" | "signup" | "success" | "user" | "onboarding-q" | "onboarding-picks";

type HomePayload = {
  todaySpecial?: HomeSpecial;
};

type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};

export function App() {
  const [view, setView] = useState<View>("home");
  const [rightPanel, setRightPanel] = useState<RightPanel>("guest");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [token, setToken] = useState("");
  const [homeData, setHomeData] = useState<HomePayload | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState("");
  const [heroImageBroken, setHeroImageBroken] = useState(false);
  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile | null>(null);
  const [expiringItems, setExpiringItems] = useState<ExpiringPreviewItem[]>([]);

  const isLoggedIn = Boolean(token);
  const special = homeData?.todaySpecial;

  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const heroImageSrc = useMemo(() => {
    if (special?.imageUrl && !heroImageBroken) return special.imageUrl;
    return DEFAULT_SPECIAL_IMAGE;
  }, [special?.imageUrl, heroImageBroken]);

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

  const mapExpiringItems = (items: PantryItem[]): ExpiringPreviewItem[] =>
    items
      .filter((i) => i.expiryStatus === "expired" || i.expiryStatus === "expiring_soon")
      .sort((a, b) => Number(a.daysUntilExpiry ?? 9999) - Number(b.daysUntilExpiry ?? 9999))
      .slice(0, 5)
      .map((item) => ({
        name: item.canonicalName || item.rawName,
        expiryDate: item.expiryDate,
        daysUntilExpiry: item.daysUntilExpiry,
        status: item.expiryStatus === "expired" ? "expired" : "expiring_soon",
      }));

  async function fetchHome() {
    try {
      setHomeLoading(true);
      setHomeError("");
      setHeroImageBroken(false);
      const res = await fetch(`${API_BASE}/home`);
      const data = (await res.json()) as HomePayload;
      if (!res.ok) { setHomeError(`Failed to load home (${res.status})`); return; }
      setHomeData(data);
    } catch (e) {
      setHomeError(`Failed to load home: ${String((e as Error).message || e)}`);
    } finally {
      setHomeLoading(false);
    }
  }

  useEffect(() => { void fetchHome(); }, []);

  useEffect(() => {
    if (!isLoggedIn) { setExpiringItems([]); return; }
    void (async () => {
      try {
        const data = await fetchPantry(token);
        setExpiringItems(mapExpiringItems(data.items));
      } catch { setExpiringItems([]); }
    })();
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (!special?.imageUrl) { setHeroImageBroken(false); return; }
    const image = new Image();
    image.onload = () => setHeroImageBroken(false);
    image.onerror = () => setHeroImageBroken(true);
    image.src = special.imageUrl;
  }, [special?.imageUrl]);

  // ─── Auth handlers ───────────────────────────────────────────────────────

  const onSignUp = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signUp({ email: email.trim(), password, givenName: givenName.trim(), familyName: familyName.trim() });
      setAuthError("Check your email for a verification code, then confirm below.");
    } catch (e) {
      setAuthError(String((e as Error).message || "Signup failed."));
    } finally {
      setAuthLoading(false);
    }
  };

  const onConfirm = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await confirmSignUp(email.trim(), code.trim());
      // After confirm → go back to login
      setRightPanel("login");
      setAuthError("");
    } catch (e) {
      setAuthError(String((e as Error).message || "Confirmation failed."));
    } finally {
      setAuthLoading(false);
    }
  };

  const onResend = async () => {
    try {
      await resendCode(email.trim());
      setAuthError("Code resent.");
    } catch (e) {
      setAuthError(String((e as Error).message || "Resend failed."));
    }
  };

  const onLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const idToken = await signIn(email.trim(), password);
      setToken(idToken);

      const bootstrapRes = await fetch(`${API_BASE}/me/bootstrap`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const bootstrapData = await bootstrapRes.json();

      if (!bootstrapRes.ok) {
        setAuthError(JSON.stringify(bootstrapData));
        return;
      }

      const meResponse = await getMe(idToken);
      const me = meResponse?.me;

      // Show success state briefly, then transition
      setRightPanel("success");

      setTimeout(() => {
        setRightPanel("user");
      }, 1800);

      setOnboardingCompleted(me?.onboardingCompleted ?? false);
    } catch (e) {
      setAuthError(String((e as Error).message || "Login failed."));
    } finally {
      setAuthLoading(false);
    }
  };



  const onLogout = () => {
    setToken("");
    setPreferenceProfile(null);
    setRightPanel("guest");
    setView("home");
    setEmail("");
    setPassword("");
    setAuthError("");
    setOnboardingCompleted(false);
  };

  const handlePicksComplete = async ({
    selectedImageIds,
    rejectedImageIds,
  }: {
    selectedImageIds: string[];
    rejectedImageIds: string[];
  }) => {
    const res = await submitRecipeSelections(token, { selectedImageIds, rejectedImageIds });
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

  // ─── Full-page views ────────────────────────────────────────────────────

  if (view === "onboarding") {
    return (
      <OnboardingQuestionnaire
        token={token}
        onCompleted={() => setView("onboarding-recipe-picks")}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "onboarding-recipe-picks") {
    return (
      <RecipePreferencePicker
        onPicksComplete={handlePicksComplete}
        onRequestMore={() => undefined}
        onBack={() => setView("home")}
      />
    );
  }

  return (
    <HomePage
      centerView={
        view === "pantry" ? "pantry" 
        : view === "recipes" ? "recipes" 
        : view === "profile" ? "profile"
        : "home"
      }
      heroImageSrc={heroImageSrc}
      special={special}
      homeLoading={homeLoading}
      homeError={homeError}
      isLoggedIn={isLoggedIn}
      accountId={accountId}
      displayName={displayName}
      avatarLabel={avatarLabel}
      expiringItems={expiringItems}
      preferenceProfile={preferenceProfile}
      rightPanel={rightPanel}
      authError={authError}
      authLoading={authLoading}
      email={email}
      password={password}
      givenName={givenName}
      familyName={familyName}
      code={code}
      token={token}
      onboardingCompleted={onboardingCompleted}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onGivenNameChange={setGivenName}
      onFamilyNameChange={setFamilyName}
      onCodeChange={setCode}
      onHome={() => setView("home")}
      onLogout={onLogout}
      onLoginNavigate={() => { setAuthError(""); setRightPanel("login"); }}
      onSignUpNavigate={() => { setAuthError(""); setRightPanel("signup"); }}
      onPantryNavigate={() => setView("pantry")}
      onLogin={onLogin}
      onSignUp={onSignUp}
      onConfirm={onConfirm}
      onResend={onResend}
      onRecipesNavigate={() => setView("recipes")}
      onRightPanelChange={setRightPanel}
      onOnboardingComplete={() => {
        setOnboardingCompleted(true);
        setRightPanel("onboarding-picks");
      }}
      onPicksComplete={handlePicksComplete}
      onRequestMorePicks={() => undefined}
      onProfileNavigate={() => setView("profile")}
    />
  );
}
