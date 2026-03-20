import { useSummary } from "../../application/useSummary";
import { SummarySection } from "../components/summary/SummarySection";
import { PantryHealthCard } from "../components/summary/PantryHealthCard";
import { CookingActivityCard } from "../components/summary/CookingActivityCard";
import { SavedRecipesCard } from "../components/summary/SavedRecipesCard";
import { WeeklyIntelligenceHero } from "../components/summary/WeeklyIntelligenceHero";
import { SmartSuggestionsGrid } from "../components/summary/SmartSuggestionsGrid";
import "../../styles/profile.css";

type Props = {
  token: string;
  onRecipeClick?: (recipeId: number) => void;
  onRecipesNavigate?: () => void;
  onPantryNavigate?: () => void;
  onPlannerNavigate?: () => void;
  embedded?: boolean;
};

export function SummaryPage({
  token,
  onRecipeClick,
  onRecipesNavigate,
  onPantryNavigate,
  onPlannerNavigate,
  embedded = false,
}: Props) {
  const { summary, loading, error } = useSummary(token);

  function handleSuggestionClick(cta: "find_recipes" | "open_planner" | "view_pantry" | "view_saved_recipes") {
    if (cta === "open_planner") {
      onPlannerNavigate?.();
      return;
    }

    if (cta === "view_pantry") {
      onPantryNavigate?.();
      return;
    }

    onRecipesNavigate?.();
  }

  const content = (
    <div className="profile-page-grid">
      <header className="ig-toolbar">
        <div className="ig-toolbar-left">
          <div>
            <p><i>Your</i></p>
            <h1 className="ig-toolbar-title">Summary</h1>
          </div>
        </div>
      </header>

      {loading && <p className="ig-page-note">Loading your summary...</p>}
      {!loading && error && <p className="ig-error-note">{error}</p>}

      {!loading && !error && summary && (
        <>
          <div className="profile-summary-top">
            <div className="profile-summary-top-main">
              <WeeklyIntelligenceHero
                snapshot={summary.snapshot}
                intelligence={summary.intelligence}
              />
            </div>

            <div className="profile-summary-top-side">
              <div className="profile-summary-side-card profile-summary-side-card-pantry">
                <SummarySection title="Pantry Health" icon="🧺">
                  <PantryHealthCard pantryHealth={summary.pantryHealth} />
                </SummarySection>
              </div>

              <div className="profile-summary-side-card profile-summary-side-card-cooking">
                <SummarySection title="Cooking Activity" icon="🍳">
                  <CookingActivityCard
                    cookingActivity={summary.cookingActivity}
                    onRecipeClick={onRecipeClick}
                  />
                </SummarySection>
              </div>
            </div>
          </div>

          <div className="profile-summary-suggestions-row">
            <SmartSuggestionsGrid
              predictions={summary.intelligence.predictions}
              suggestions={summary.intelligence.suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          <div className="profile-summary-bottom">
            <SummarySection title="Saved Recipes" icon="🔖">
              <SavedRecipesCard
                savedRecipes={summary.savedRecipes}
                onRecipeClick={onRecipeClick}
              />
            </SummarySection>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) {
    return <section className="ig-profile-embedded">{content}</section>;
  }

  return (
    <main className="ig-screen">
      <section className="ig-page-shell">{content}</section>
    </main>
  );
}
