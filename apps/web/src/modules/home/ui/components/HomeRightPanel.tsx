import { useEffect, useRef } from "react";
import type { RightPanel } from "../../../../app/App";
import type { ExpiringPreviewItem } from "../../model/home.shared.types";
import { OnboardingQuestionnaire, RecipePreferencePicker } from "../../../onboarding";
import { LoginForm, SignupForm, VerificationForm } from "../../../auth";
import { GuestPanel } from "./GuestPanel";
import { UserPanel } from "./UserPanel";

type HomeRightPanelProps = {
  rightPanel: RightPanel;
  avatarLabel: string;
  accountId: string;
  displayName: string;
  onboardingCompleted: boolean;
  expiringItems: ExpiringPreviewItem[];
  authError: string;
  authLoading: boolean;
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  code: string;
  token: string;
  signupStage: 'form' | 'verify';
  onSetSignupStage: (stage: 'form' | 'verify') => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onGivenNameChange: (v: string) => void;
  onFamilyNameChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
  onSignUpNavigate: () => void;
  onPantryNavigate: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onConfirm: () => void;
  onResend: () => void;
  onOnboardingComplete: () => void;
  onPicksComplete: (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => Promise<void>;
  onRequestMorePicks: () => void;
  onRightPanelChange: (panel: RightPanel) => void;
};

function AnimatedPanel({ panelKey, children }: { panelKey: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("ig-right-panel-enter");
    void el.offsetWidth;
    el.classList.add("ig-right-panel-enter");
  }, [panelKey]);

  return <div ref={ref}>{children}</div>;
}

export function HomeRightPanel({
  rightPanel,
  avatarLabel,
  accountId,
  displayName,
  onboardingCompleted,
  expiringItems,
  authError,
  authLoading,
  email,
  password,
  givenName,
  familyName,
  code,
  token,
  signupStage,
  onSetSignupStage,
  onEmailChange,
  onPasswordChange,
  onGivenNameChange,
  onFamilyNameChange,
  onCodeChange,
  onLogout,
  onLoginNavigate,
  onSignUpNavigate,
  onPantryNavigate,
  onLogin,
  onSignUp,
  onConfirm,
  onResend,
  onOnboardingComplete,
  onPicksComplete,
  onRequestMorePicks,
  onRightPanelChange,
}: HomeRightPanelProps) {
  switch (rightPanel) {
    case "guest":
      return (
        <AnimatedPanel panelKey="guest">
          <GuestPanel onLoginNavigate={onLoginNavigate} />
        </AnimatedPanel>
      );

    case "login":
      return (
        <AnimatedPanel panelKey="login">
          <LoginForm
            email={email}
            password={password}
            authError={authError}
            authLoading={authLoading}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
            onLogin={onLogin}
            onSignUpNavigate={onSignUpNavigate}
          />
        </AnimatedPanel>
      );

    case "signup":
      return (
        <AnimatedPanel panelKey={`signup-${signupStage}`}>
          {signupStage === 'form' ? (
            <SignupForm
              email={email}
              password={password}
              givenName={givenName}
              familyName={familyName}
              authError={authError}
              authLoading={authLoading}
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
              onGivenNameChange={onGivenNameChange}
              onFamilyNameChange={onFamilyNameChange}
              onSignUp={onSignUp}
              onLoginNavigate={onLoginNavigate}
            />
          ) : (
            <VerificationForm
              email={email}
              code={code}
              authError={authError}
              authLoading={authLoading}
              onCodeChange={onCodeChange}
              onConfirm={onConfirm}
              onResend={onResend}
              onBackToSignup={() => onSetSignupStage('form')}
            />
          )}
        </AnimatedPanel>
      );

    case "success":
      return (
        <AnimatedPanel panelKey="success">
          <section className="success-panel">
            <div className="success-icon">✓</div>
            <h3 className="success-title">Welcome back!</h3>
            <p className="success-text">Loading your pantry…</p>
          </section>
        </AnimatedPanel>
      );

    case "user":
      return (
        <AnimatedPanel panelKey="user">
          <UserPanel
            avatarLabel={avatarLabel}
            accountId={accountId}
            displayName={displayName}
            onboardingCompleted={onboardingCompleted}
            expiringItems={expiringItems}
            onLogout={onLogout}
            onStartOnboarding={() => onRightPanelChange("onboarding-q")}
            onPantryNavigate={onPantryNavigate}
          />
        </AnimatedPanel>
      );

    case "onboarding-q":
      return (
        <AnimatedPanel panelKey="onboarding-q">
          <OnboardingQuestionnaire
            token={token}
            onCompleted={onOnboardingComplete}
            onBack={() => onRightPanelChange("user")}
          />
        </AnimatedPanel>
      );

    case "onboarding-picks":
      return (
        <AnimatedPanel panelKey="onboarding-picks">
          <RecipePreferencePicker
            onPicksComplete={onPicksComplete}
            onRequestMore={onRequestMorePicks}
            onBack={() => onRightPanelChange("user")}
          />
        </AnimatedPanel>
      );
  }
}
