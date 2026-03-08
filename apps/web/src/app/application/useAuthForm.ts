import { useState } from "react";
import { confirmSignUp, resendCode, signIn, signUp } from "../../modules/auth";
import { getMe } from "../../modules/onboarding";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

export function useAuthForm(onLoginSuccess: (token: string, userId: string, email: string, onboardingCompleted: boolean) => void) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleSignUp = async () => {
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

  const handleConfirm = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await confirmSignUp(email.trim(), code.trim());
      setAuthError("");
      return true;
    } catch (e) {
      setAuthError(String((e as Error).message || "Confirmation failed."));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendCode(email.trim());
      setAuthError("Code resent.");
    } catch (e) {
      setAuthError(String((e as Error).message || "Resend failed."));
    }
  };

  const handleLogin = async () => {
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

      const payload = JSON.parse(atob(idToken.split(".")[1]));
      onLoginSuccess(idToken, payload.sub ?? me?.id ?? "", me?.email ?? email.trim(), me?.onboardingCompleted ?? false);
    } catch (e) {
      setAuthError(String((e as Error).message || "Login failed."));
    } finally {
      setAuthLoading(false);
    }
  };

  const reset = () => {
    setEmail("");
    setPassword("");
    setAuthError("");
  };

  return {
    email,
    password,
    givenName,
    familyName,
    code,
    authError,
    authLoading,
    setEmail,
    setPassword,
    setGivenName,
    setFamilyName,
    setCode,
    setAuthError,
    handleSignUp,
    handleConfirm,
    handleResend,
    handleLogin,
    reset,
  };
}
