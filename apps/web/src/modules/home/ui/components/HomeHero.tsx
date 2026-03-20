import { useMemo, useState, useEffect, useCallback } from "react";
import type { HomeSpecial } from "../../model/home.types";
import type { ExpiringPreviewItem } from "../../model/home.shared.types";
import type { RightPanel } from "../../../../app/App";
import { PantryPage } from "../../../pantry";
import { RecipesPage } from "../../../recipes";
import { ProfilePage, EditProfilePage } from "../../../profile";
import { CommunityFeed, useCommunityFeed, useTopicPosts, useWeeklyTopics, WeeklyStoryCircles, PostComposer } from "../../../community";
import { HomeSidebar } from "./HomeSidebar";
import { HomeRightPanel } from "./HomeRightPanel";
import { DailySpecialCard } from "./DailySpecialCard";
import { SummaryPage } from "../../../profile";
import { PlannerPage } from "../../../planner";

type HomeHeroProps = {
  centerView: "home" | "pantry" | "recipes" | "profile" | "edit-profile" | "community" | "summary" | "planner";
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
  onPantryMutated: () => void;
  onSummaryNavigate: () => void;
  onPlannerNavigate: () => void;
  homeResetKey: number;
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
    onSummaryNavigate,
    onPlannerNavigate,
    homeResetKey,
  } = props;

  const { posts, pinnedTopic, nextCursor, loading, loadingMore, error, loadMore, refresh } =
    useCommunityFeed({ token, enabled: true });
  
  const { topics } = useWeeklyTopics();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const {
    posts: topicPosts,
    loading: topicPostsLoading,
    error: topicPostsError,
  } = useTopicPosts({ topicId: selectedTopicId, token: token || undefined });

  const [showComposer, setShowComposer] = useState(false);
  const [pantryKey, setPantryKey] = useState(0);



  useEffect(() => {
    setSelectedTopicId(null);
    setSelectedDate(null);
  }, [homeResetKey]);

  useEffect(() => {
    if (pantryKey > 0) {
      props.onPantryMutated();
    }
  }, [pantryKey]);

  const triggerPantryRefresh = useCallback(() => {
    setPantryKey((k) => k + 1);
  }, []);
  
  const displayedPosts = selectedTopicId ? topicPosts : posts;

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



  return (
    <section className="ig-home">
      <HomeSidebar
        centerView={centerView}
        isLoggedIn={isLoggedIn}
        onHome={() => {
          setSelectedTopicId(null);
          onHome();
        }}
        onPantryNavigate={onPantryNavigate}
        onRecipesNavigate={onRecipesNavigate}
        onProfileNavigate={onProfileNavigate}
        onSummaryNavigate={onSummaryNavigate}
        onPlannerNavigate={onPlannerNavigate}
        onLogout={onLogout}
        onLoginNavigate={onLoginNavigate}
      />

      <div className="ig-main-wrap">
        <div className="ig-content-grid">
          <section className="ig-center-col">
            {centerView === "pantry" ? (
              <PantryPage 
                key={pantryKey}
                token={token} 
                onBack={onHome} 
                onGenerateRecipes={onRecipesNavigate} 
                onMutated={props.onPantryMutated}
                embedded />
            ) : centerView === "recipes" ? (
              <RecipesPage 
                token={token} 
                onBack={onHome} 
                onPantryNavigate= {() => {
                  triggerPantryRefresh();   
                  onPantryNavigate();
                }}
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
            ) : centerView === "summary" ? (
              <SummaryPage
                token={token}
                onRecipeClick={() => onRecipesNavigate()}
                onRecipesNavigate={onRecipesNavigate}
                onPantryNavigate={onPantryNavigate}
                onPlannerNavigate={onPlannerNavigate}
                embedded
              />
            ) : centerView === "planner" ? (
              <PlannerPage token={token} embedded />
            ) : centerView === "community" ? (
              <>
                <WeeklyStoryCircles
                  topics={topics}
                  selectedTopicId={selectedTopicId}
                  onSelect={setSelectedTopicId}
                />
                <CommunityFeed
                  posts={displayedPosts}
                  pinnedTopic={selectedTopicId || selectedDate ? undefined : pinnedTopic}
                  nextCursor={selectedTopicId ? null : nextCursor}
                  loading={selectedTopicId ? topicPostsLoading : loading}
                  loadingMore={selectedTopicId ? false : loadingMore}
                  error={selectedTopicId ? topicPostsError : error}
                  isLoggedIn={isLoggedIn}
                  token={token}
                  currentUserId={isLoggedIn ? sub : undefined}
                  onLoadMore={selectedTopicId ? () => {} : loadMore}
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
