import { useSession } from "./application/useSession";
import { useAuthForm } from "./application/useAuthForm";
import { useAppNavigation } from "./application/useAppNavigation";
import { OnboardingQuestionnaire, RecipePreferencePicker } from "../modules/onboarding";
import { HomePage } from "../modules/home";
import { useIdentity } from "./application/useIdentity";
import { useHomeAndPantryPreview } from "./application/useHomeAndPantryPreview";

export type RightPanel = "guest" | "login" | "signup" | "success" | "user" | "onboarding-q" | "onboarding-picks";

export function App() {
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
  const sessionSub = session.status === "authenticated" ? session.userId : undefined;
  
  const { displayName, accountId, avatarLabel, sub } = useIdentity({
    email,
    givenName,
    familyName,
    isLoggedIn,
    sub: sessionSub,
  });
  
  const { special, heroImageSrc, homeLoading, homeError, expiringItems } = useHomeAndPantryPreview(
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
  };

  const onConfirm = async () => {
    const success = await handleConfirm();
    if (success) setRightPanel("login");
  };

  const onResend = async () => {
    await handleResend();
  };
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
        : "community"
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
