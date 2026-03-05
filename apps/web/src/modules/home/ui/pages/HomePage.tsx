import { HomeHero } from "../components/HomeHero";
import type { HomeSpecial, PreferenceProfile } from "../../model/home.types";
import type { RightPanel } from "../../../../app/App";

type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};

type HomePageProps = {
  centerView: "home" | "pantry" | "recipes" | "profile" | "edit-profile";
  heroImageSrc: string;
  special?: HomeSpecial;
  homeLoading: boolean;
  homeError: string;
  isLoggedIn: boolean;
  accountId: string;
  displayName: string;
  avatarLabel: string;
  expiringItems: ExpiringPreviewItem[];
  preferenceProfile: PreferenceProfile | null;
  rightPanel: RightPanel;
  authError: string;
  authLoading: boolean;
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  code: string;
  token: string;
  onboardingCompleted: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onGivenNameChange: (v: string) => void;
  onFamilyNameChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onHome: () => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
  onSignUpNavigate: () => void;
  onPantryNavigate: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onConfirm: () => void;
  onResend: () => void;
  onRecipesNavigate: () => void;
  onRightPanelChange: (panel: RightPanel) => void;
  onOnboardingComplete: () => void;
  onPicksComplete: (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => Promise<void>;
  onRequestMorePicks: () => void;
  onProfileNavigate: () => void;
  onEditProfileNavigate: () => void;
};


export function HomePage(props: HomePageProps)
{
  return (
    <main className="page-shell">
      <HomeHero
        {...props}
      />
    </main>
  );
}
