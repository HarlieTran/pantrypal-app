import { HomeCommunityStrip } from "../components/HomeCommunityStrip";
import { HomeHero } from "../components/HomeHero";
import { HomeInfoStrip } from "../components/HomeInfoStrip";
import type { CommunityPost, HomeSpecial, PreferenceProfile } from "../types";

const COMMUNITY_TEASER: CommunityPost[] = [
  { id: "1", title: "Homemade ramen night", author: "Lina" },
  { id: "2", title: "Quick vegan tacos", author: "Sam" },
  { id: "3", title: "Family biryani recipe", author: "Ari" },
];

type HomePageProps = {
  heroImageSrc: string;
  special?: HomeSpecial;
  homeLoading: boolean;
  homeError: string;
  isLoggedIn: boolean;
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
  preferenceProfile,
  result,
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
        onHome={onHome}
        onLogout={onLogout}
        onLoginNavigate={onLoginNavigate}
        onPantryNavigate={onPantryNavigate}
      />

      {isLoggedIn ? <HomeInfoStrip /> : null}

      <HomeCommunityStrip posts={COMMUNITY_TEASER} />

      {preferenceProfile ? (
        <section className="profile-strip">
          <h2>Your Food Preference Profile</h2>
          <p><strong>Likely likes:</strong> {preferenceProfile.likes.join(", ") || "N/A"}</p>
          <p><strong>Likely dislikes:</strong> {preferenceProfile.dislikes.join(", ") || "N/A"}</p>
          <p><strong>Diet signals:</strong> {preferenceProfile.dietSignals.join(", ") || "N/A"}</p>
          <p><strong>Confidence:</strong> {Math.round(preferenceProfile.confidence.overall * 100)}%</p>
        </section>
      ) : null}

      <pre className="result-log">{result || "Result here"}</pre>
    </main>
  );
}

