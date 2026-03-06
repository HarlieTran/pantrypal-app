import { useState, useEffect } from "react";
import { useSession } from "./application/useSession";
import { confirmSignUp, resendCode, signIn, signUp } from "../modules/auth";
import { getMe } from "../modules/onboarding";
import { OnboardingQuestionnaire, RecipePreferencePicker, submitRecipeSelections } from "../modules/onboarding";
import { HomePage } from "../modules/home";
import type { PreferenceProfile } from "../modules/home";
import { useIdentity } from "./application/useIdentity";
import { useHomeAndPantryPreview } from "./application/useHomeAndPantryPreview";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

type View = "home" | "onboarding" | "onboarding-recipe-picks" | "pantry" | "recipes" | "profile" | "edit-profile";

// Right panel state machine — all auth lives here
export type RightPanel = "guest" | "login" | "signup" | "success" | "user" | "onboarding-q" | "onboarding-picks";

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

  const { session, login, logout } = useSession();
  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile | null>(null);

  const isLoggedIn = session.status === "authenticated";
  const token = session.status === "authenticated" ? session.token : "";
  const { displayName, accountId, avatarLabel } = useIdentity({ email, givenName, familyName, isLoggedIn });
  const { special, heroImageSrc, homeLoading, homeError, expiringItems } = 
    useHomeAndPantryPreview(
      token,
      isLoggedIn,
      session.status === "bootstrapping",
    );

  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // ─── Auth handlers ───────────────────────────────────────────────────────

  // Sync rightPanel and onboardingCompleted when bootstrap resolves
  useEffect(() => {
    if (session.status === "authenticated") {
      // Fetch the user's me data to get onboarding status
      void (async () => {
        try {
          const meResponse = await getMe(session.token);
          const me = meResponse?.me;
          setOnboardingCompleted(me?.onboardingCompleted ?? false);
          setRightPanel("user");
        } catch {
          // If fetch fails, still show user panel
          setRightPanel("user");
        }
      })();
    }
  }, [session.status]); // only re-runs when status changes

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

      // Update session state via useSession
      login(idToken, me?.id ?? "", me?.email ?? email.trim());

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
    logout();
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

  if (session.status === "bootstrapping") {
    return (
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--page-bg)",
      }}>
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      </main>
    );
  }
  
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
        : view === "edit-profile" ? "edit-profile"
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
      onEditProfileNavigate={() => setView("edit-profile")}
    />
  );
}
