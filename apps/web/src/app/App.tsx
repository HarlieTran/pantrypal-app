import { useSession } from "./application/useSession";
import { useAuthForm } from "./application/useAuthForm";
import { useAppNavigation } from "./application/useAppNavigation";
import { OnboardingQuestionnaire, RecipePreferencePicker } from "../modules/onboarding";
import { HomePage } from "../modules/home";
import { useIdentity } from "./application/useIdentity";
import { useHomeAndPantryPreview } from "./application/useHomeAndPantryPreview";
import { useProfilePageData } from "../modules/profile/application/useProfilePageData";
import "./styles/app.css";
import { useState } from "react";

export type RightPanel = "guest" | "login" | "signup" | "success" | "user" | "onboarding-q" | "onboarding-picks";

export function App() {
  const [signupStage, setSignupStage] = useState<'form' | 'verify'>('form');
  const [homeResetKey, setHomeResetKey] = useState(0);
  const { session, login, logout } = useSession();
  
  const {
    view,
    setView,
    rightPanel,
    setRightPanel,
    onboardingCompleted,
    setOnboardingCompleted,
    preferenceProfile,
    handlePicksComplete,
    resetOnLogout,
  } = useAppNavigation(session.status, session.status === "authenticated" ? session.token : "");

  const {
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
    reset: resetAuthForm,
  } = useAuthForm((token, userId, email, onboardingCompleted) => {
    login(token, userId, email);
    setRightPanel("success");
    setTimeout(() => setRightPanel("user"), 1800);
    setOnboardingCompleted(onboardingCompleted);
  });

  const isLoggedIn = session.status === "authenticated";
  const token = session.status === "authenticated" ? session.token : "";
  const sessionSub = session.status === "authenticated" ? (session.userId ?? undefined) : undefined;
  
  const { profile } = useProfilePageData(isLoggedIn ? token : "");
  
  const { displayName, accountId, avatarLabel, sub } = useIdentity({
    isLoggedIn,
    sub: sessionSub,
    profileDisplayName: profile?.displayName ?? undefined,
    profileEmail: profile?.email ?? undefined,
  });
  
  const { special, heroImageSrc, homeLoading, homeError, expiringItems, refreshExpiringItems } = 
    useHomeAndPantryPreview(
      token,
      isLoggedIn,
      session.status === "bootstrapping",
    );

  const onLogout = () => {
    logout();
    resetOnLogout();
    resetAuthForm();
  };

  const onLogin = async () => {
    await handleLogin();
  };

  const onSignUp = async () => {
    await handleSignUp();

    // Move to verification stage after successful signup
    setSignupStage('verify');
  };

  const onConfirm = async () => {
    const success = await handleConfirm();
    if (success) {
      setSignupStage('form');
      setRightPanel("login");
    }
  };

  const onResend = async () => {
    await handleResend();
  };
  if (session.status === "bootstrapping") {
    return (
      <main className="app-loading">
        <p className="app-loading-text">Loading...</p>
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
        : view === "community" ? "community"
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
      sub={sub}
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
      signupStage={signupStage}
      onSetSignupStage={setSignupStage}
      onboardingCompleted={onboardingCompleted}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onGivenNameChange={setGivenName}
      onFamilyNameChange={setFamilyName}
      onCodeChange={setCode}
      onHome={() => {
        setView("home");
        setHomeResetKey((k) => k + 1);
      }}
      onLogout={onLogout}
      onLoginNavigate={() => { 
        setAuthError(""); 
        setSignupStage('form');
        setRightPanel("login"); 
      }}
      onSignUpNavigate={() => { 
        setAuthError(""); 
        setSignupStage('form');
        setRightPanel("signup"); }}
      onPantryNavigate={() => {
        setView("pantry")
        void refreshExpiringItems();
      }}
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
      onPantryMutated={refreshExpiringItems}
      homeResetKey={homeResetKey}
    />
  );
}
