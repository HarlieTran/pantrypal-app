import { useState } from "react";
import { confirmSignUp, resendCode, signIn, signUp } from "./lib/auth/cognito";
import { getMe } from "./lib/api/onboarding";
import { OnboardingQuestionnaire } from "./components/OnboardingQuestionnaire";
import { RecipePreferencePicker } from "./components/RecipePreferencePicker";
import { submitRecipeSelections } from "./lib/api/onboarding";


const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

type View = "auth" | "onboarding" | "onboarding-recipe-picks" | "home";

export function App() {
  const [view, setView] = useState<View>("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");

  const [token, setToken] = useState("");
  const [result, setResult] = useState("");

  const onSignUp = async () => {
    try {
      await signUp({
        email: email.trim(),
        password,
        givenName: givenName.trim(),
        familyName: familyName.trim(),
      });
      setResult("Signup success. Check email for verification code.");
    } catch (e) {
      setResult(`Signup error: ${String((e as Error).message || e)}`);
    }
  };

  const onConfirm = async () => {
    try {
      await confirmSignUp(email.trim(), code.trim());
      setResult("Verification success. You can login now.");
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
    setView("auth");
    setResult("Logged out.");
  };

  const [preferenceProfile, setPreferenceProfile] = useState<{
    likes: string[];
    dislikes: string[];
    dietSignals: string[];
    confidence: { likes: number; dislikes: number; overall: number };
  } | null>(null);


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

  if (view === "home") {
    return (
      <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1>PantryPal Home</h1>
        <p>You are logged in and onboarding is complete.</p>
        <button onClick={onLogout}>Logout</button>
        {preferenceProfile ? (
          <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Your Food Preference Profile</h2>
            <p><strong>Likely likes:</strong> {preferenceProfile.likes.join(", ") || "N/A"}</p>
            <p><strong>Likely dislikes:</strong> {preferenceProfile.dislikes.join(", ") || "N/A"}</p>
            <p><strong>Diet signals:</strong> {preferenceProfile.dietSignals.join(", ") || "N/A"}</p>
            <p>
              <strong>Confidence:</strong> overall{" "}
              {Math.round(preferenceProfile.confidence.overall * 100)}%
            </p>
          </section>
        ) : (
          <p style={{ marginTop: 16 }}>{result}</p>
        )}

      </main>
    );
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Auth Test</h1>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          placeholder="given name"
          value={givenName}
          onChange={(e) => setGivenName(e.target.value)}
        />
        <input
          placeholder="family name"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
        />
        <input
          placeholder="verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={onSignUp}>Sign up</button>
        <button onClick={onConfirm}>Confirm code</button>
        <button onClick={onResend}>Resend code</button>
        <button onClick={onLogin}>Login + bootstrap</button>
      </div>

      <p>
        <strong>ID token:</strong> {token ? "received" : "not received"}
      </p>

      <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, overflowX: "auto" }}>
        {result || "Result here"}
      </pre>
    </main>
  );
}
