import { HomeHero } from "../components/HomeHero";
import type { HomeSpecial, PreferenceProfile } from "../types";

type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};

type HomePageProps = {
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
  result: string;
  onHome: () => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
  onPantryNavigate: () => void;
};

export function HomePage({
  heroImageSrc,
  special,
  homeLoading,
  homeError,
  isLoggedIn,
  accountId,
  displayName,
  avatarLabel,
  expiringItems,
  preferenceProfile: _preferenceProfile,
  result: _result,
  onHome,
  onLogout,
  onLoginNavigate,
  onPantryNavigate,
}: HomePageProps) {
  return (
    <main className="page-shell">
      <HomeHero
        heroImageSrc={heroImageSrc}
        special={special}
        homeLoading={homeLoading}
        homeError={homeError}
        isLoggedIn={isLoggedIn}
        accountId={accountId}
        displayName={displayName}
        avatarLabel={avatarLabel}
        expiringItems={expiringItems}
        onHome={onHome}
        onLogout={onLogout}
        onLoginNavigate={onLoginNavigate}
        onPantryNavigate={onPantryNavigate}
      />
    </main>
  );
}
