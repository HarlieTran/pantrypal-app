import { useMemo, useState } from "react";
import type { HomeSpecial } from "../../model/home.types";
import type { ExpiringPreviewItem } from "../../model/home.shared.types";
import type { RightPanel } from "../../../../app/App";
import { PantryPage } from "../../../pantry";
import { RecipesPage } from "../../../recipes";
import { ProfilePage, EditProfilePage } from "../../../profile";
import { CommunityFeed, useCommunityFeed, useWeeklyTopics, WeeklyStoryCircles, PostComposer } from "../../../community";
import { HomeSidebar } from "./HomeSidebar";
import { HomeRightPanel } from "./HomeRightPanel";
import { DailySpecialCard } from "./DailySpecialCard";

type HomeHeroProps = {
  centerView: "home" | "pantry" | "recipes" | "profile" | "edit-profile" | "community";
  heroImageSrc: string;
  special?: HomeSpecial;
  homeLoading: boolean;
  homeError: string;
  isLoggedIn: boolean;
  accountId: string;
  displayName: string;
  avatarLabel: string;
  expiringItems: ExpiringPreviewItem[];
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
  sub?: string;
  signupStage: 'form' | 'verify';
  onSetSignupStage: (stage: 'form' | 'verify') => void;
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
  onOnboardingComplete: () => void;
  onPicksComplete: (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => Promise<void>;
  onRequestMorePicks: () => void;
  onRightPanelChange: (panel: RightPanel) => void;
  onProfileNavigate: () => void;
  onEditProfileNavigate: () => void;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function HomeHero(props: HomeHeroProps) {
  const {
    centerView,
    heroImageSrc,
    special,
    homeLoading,
    homeError,
    isLoggedIn,
    accountId,
    displayName,
    avatarLabel,
    token,
    sub,
    onHome,
    onLogout,
    onLoginNavigate,
    onPantryNavigate,
    onRecipesNavigate,
    onProfileNavigate,
    onEditProfileNavigate,
    onRightPanelChange,
  } = props;

  const { posts, pinnedTopic, nextCursor, loading, loadingMore, error, loadMore, refresh } =
    useCommunityFeed({ token, enabled: true });
  
  const { topics } = useWeeklyTopics();
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  
  const filteredPosts = selectedTopicId
  ? posts.filter((p) => p.topicId === selectedTopicId)
  : posts;

  const today = new Date();
  const todayIndex = today.getDay();
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const stories = useMemo(
    () =>
      WEEK_DAYS.map((day, index) => ({
        day,
        isToday: index === todayIndex,
        title: index === todayIndex ? special?.dishName || "Today" : "Special",
      })),
    [special?.dishName, todayIndex],
  );

  const [showComposer, setShowComposer] = useState(false);

  return (
    <section className="ig-home">
      <HomeSidebar
        centerView={centerView}
        isLoggedIn={isLoggedIn}
        onHome={onHome}
        onPantryNavigate={onPantryNavigate}
        onRecipesNavigate={onRecipesNavigate}
        onProfileNavigate={onProfileNavigate}
        onLogout={onLogout}
        onLoginNavigate={onLoginNavigate}
      />

      <div className="ig-main-wrap">
        <div className="ig-content-grid">
          <section className="ig-center-col">
            {centerView === "pantry" ? (
              <PantryPage token={token} onBack={onHome} onGenerateRecipes={onRecipesNavigate} embedded />
            ) : centerView === "recipes" ? (
              <RecipesPage 
                token={token} 
                onBack={onHome} 
                onPantryNavigate={onPantryNavigate}
                embedded />
            ) : centerView === "profile" ? (
              <ProfilePage
                token={token}
                avatarLabel={avatarLabel}
                displayName={displayName}
                accountId={accountId}
                onboardingCompleted={props.onboardingCompleted}
                onStartOnboarding={() => onRightPanelChange("onboarding-q")}
                onEditProfile={onEditProfileNavigate}
                embedded />
            ) : centerView === "edit-profile" ? (
              <EditProfilePage 
                token={token}
                displayName={displayName}
                onBack={onProfileNavigate} />
            ) : centerView === "community" ? (
              <>
                <WeeklyStoryCircles
                  topics={topics}
                  selectedTopicId={selectedTopicId}
                  onSelect={setSelectedTopicId}
                />
                <CommunityFeed
                  posts={filteredPosts}
                  pinnedTopic={selectedDate ? undefined : pinnedTopic}
                  nextCursor={nextCursor}
                  loading={loading}
                  loadingMore={loadingMore}
                  error={error}
                  isLoggedIn={isLoggedIn}
                  token={token}
                  currentUserId={isLoggedIn ? sub : undefined}
                  onLoadMore={loadMore}
                  onLoginNavigate={onLoginNavigate}
                  onCreatePost={isLoggedIn ? () => setShowComposer(true) : undefined}
                />
              </>
            ) : (
              <>
                <div className="ig-stories" aria-label="Weekly special recipes">
                  {stories.map((story, idx) => (
                    <article key={`${story.day}-${idx}`} className="ig-story-item">
                      <button className={`ig-story-ring${story.isToday ? " is-today" : ""}`}>
                        <img src={heroImageSrc} alt={`${story.day} special`} />
                      </button>
                      <span className="ig-story-day">{story.day}</span>
                    </article>
                  ))}
                </div>

                <DailySpecialCard
                  special={special}
                  heroImageSrc={heroImageSrc}
                  avatarLabel={avatarLabel}
                  todayLabel={todayLabel}
                  homeLoading={homeLoading}
                  homeError={homeError}
                />
              </>
            )}
          </section>

          <aside className="ig-right-col">
            <HomeRightPanel {...props} />
          </aside>
        </div>
      </div>

      {showComposer && (
        <>
          <div onClick={() => setShowComposer(false)} className="modal-backdrop" />
          <div className="modal-container">
            <div className="modal-header">
              <span className="modal-title">New Post</span>
              <button onClick={() => setShowComposer(false)} className="modal-close">✕</button>
            </div>
            <PostComposer
              token={token}
              pinnedTopic={pinnedTopic}
              onPostCreated={() => {
                setShowComposer(false);
                refresh();
              }}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        </>
      )}
    </section>
  );
}
