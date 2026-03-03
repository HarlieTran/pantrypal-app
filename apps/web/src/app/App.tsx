import { useEffect, useMemo, useState } from "react";
import { confirmSignUp, resendCode, signIn, signUp } from "../features/auth";
import { getMe } from "../features/onboarding";
import { OnboardingQuestionnaire } from "../features/onboarding";
import { RecipePreferencePicker } from "../features/onboarding";
import { submitRecipeSelections } from "../features/onboarding";
import { HomePage } from "../features/home";
import { LoginPage } from "../features/auth";
import { SignUpPage } from "../features/auth";
import type { HomeSpecial, PreferenceProfile } from "../features/home";
import { PantryPage } from "../features/pantry";
import { RecipesPage } from "../features/recipes";


const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";
const DEFAULT_SPECIAL_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2600&q=95";

type View = "home" | "auth" | "onboarding" | "onboarding-recipe-picks" | "pantry" | "recipes";

type HomePayload = {
  todaySpecial?: HomeSpecial;
  navigation?: {
    pantryPath?: string;
    communityPath?: string;
  };
};

export function App() {
  const [view, setView] = useState<View>("home");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");

  const [token, setToken] = useState("");
  const [result, setResult] = useState("");
  const [homeData, setHomeData] = useState<HomePayload | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState("");
  const [heroImageBroken, setHeroImageBroken] = useState(false);

  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile | null>(null);

  const isLoggedIn = Boolean(token);
  const special = homeData?.todaySpecial;

  const heroImageSrc = useMemo(() => {
    if (special?.imageUrl && !heroImageBroken) return special.imageUrl;
    return DEFAULT_SPECIAL_IMAGE;
  }, [special?.imageUrl, heroImageBroken]);

  async function fetchHome() {
    try {
      setHomeLoading(true);
      setHomeError("");
      setHeroImageBroken(false);

      const res = await fetch(`${API_BASE}/home`);
      const data = (await res.json()) as HomePayload;

      if (!res.ok) {
        setHomeError(`Failed to load home (${res.status})`);
        return;
      }

      setHomeData(data);
    } catch (e) {
      setHomeError(`Failed to load home: ${String((e as Error).message || e)}`);
    } finally {
      setHomeLoading(false);
    }
  }

  useEffect(() => {
    if (view === "home" || view === "auth") {
      void fetchHome();
    }
  }, [view]);

  useEffect(() => {
    if (!special?.imageUrl) {
      setHeroImageBroken(false);
      return;
    }

    const image = new Image();
    image.onload = () => setHeroImageBroken(false);
    image.onerror = () => setHeroImageBroken(true);
    image.src = special.imageUrl;
  }, [special?.imageUrl]);

  const onSignUp = async () => {
    try {
      await signUp({
        email: email.trim(),
        password,
        givenName: givenName.trim(),
        familyName: familyName.trim(),
      });
      setResult("Signup success. Check email for verification code.");
      setView("auth");
      setAuthMode("signup");
    } catch (e) {
      setResult(`Signup error: ${String((e as Error).message || e)}`);
    }
  };

  const onConfirm = async () => {
    try {
      await confirmSignUp(email.trim(), code.trim());
      setResult("Verification success. You can login now.");
      setAuthMode("login");
    } catch (e) {
      setResult(`Confirm error: ${String((e as Error).message || e)}`);
    }
  };

  const onResend = async () => {
    try {
      await resendCode(email.trim());
      setResult("Verification code resent.");
    } catch (e) {
      setResult(`Resend error: ${String((e as Error).message || e)}`);
    }
  };

  const onLogin = async () => {
    try {
      const idToken = await signIn(email.trim(), password);
      setToken(idToken);

      const bootstrapRes = await fetch(`${API_BASE}/me/bootstrap`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const bootstrapData = await bootstrapRes.json();

      if (!bootstrapRes.ok) {
        setResult(JSON.stringify({ status: bootstrapRes.status, data: bootstrapData }, null, 2));
        return;
      }

      const meResponse = await getMe(idToken);
      const me = meResponse?.me;

      if (me?.onboardingCompleted) {
        setView("home");
        setResult("Login success. Onboarding already completed.");
      } else {
        setView("onboarding");
        setResult("Login success. Please complete onboarding.");
      }
    } catch (e) {
      setResult(`Login error: ${String((e as Error).message || e)}`);
    }
  };

  const onLogout = () => {
    setToken("");
    setPreferenceProfile(null);
    setView("home");
    setResult("Logged out.");
  };

  if (view === "onboarding") {
    return (
      <OnboardingQuestionnaire
        token={token}
        onCompleted={() => {
          setView("onboarding-recipe-picks");
          setResult("Questions saved. Now pick recipe preferences.");
        }}
      />
    );
  }

  if (view === "onboarding-recipe-picks") {
    return (
      <RecipePreferencePicker
        onSubmitSelection={async ({ selectedImageIds, rejectedImageIds }) => {
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

          setResult("Preference profile generated successfully.");
          setView("home");
        }}
      />
    );
  }

  if (view === "auth" && authMode === "login") {
    return (
      <LoginPage
        email={email}
        password={password}
        result={result}
        heroImageSrc={heroImageSrc}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onLogin={onLogin}
        onGoSignUp={() => setAuthMode("signup")}
        onBackHome={() => setView("home")}
      />
    );
  }

  if (view === "auth" && authMode === "signup") {
    return (
      <SignUpPage
        email={email}
        password={password}
        givenName={givenName}
        familyName={familyName}
        code={code}
        result={result}
        heroImageSrc={heroImageSrc}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onGivenNameChange={setGivenName}
        onFamilyNameChange={setFamilyName}
        onCodeChange={setCode}
        onSignUp={onSignUp}
        onConfirm={onConfirm}
        onResend={onResend}
        onGoLogin={() => setAuthMode("login")}
        onBackHome={() => setView("home")}
      />
    );
  }

  if (view === "pantry") {
    return (
      <PantryPage
        token={token}
        onBack={() => setView("home")}
        onGenerateRecipes={() => setView("recipes")}
      />
    );
  }

  if (view === "recipes") {
    return <RecipesPage token={token} onBack={() => setView("pantry")} />;
  }


  return (
    <HomePage
      heroImageSrc={heroImageSrc}
      special={special}
      homeLoading={homeLoading}
      homeError={homeError}
      isLoggedIn={isLoggedIn}
      preferenceProfile={preferenceProfile}
      result={result}
      onHome={() => setView("home")}
      onLogout={onLogout}
      onLoginNavigate={() => {
        setAuthMode("login");
        setView("auth");
      }}
      onPantryNavigate={() => setView("pantry")}
    />
  );
}


