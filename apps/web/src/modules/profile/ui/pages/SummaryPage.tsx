import { useSummary } from "../../application/useSummary";
import { SummarySection } from "../components/summary/SummarySection";
import { PantryHealthCard } from "../components/summary/PantryHealthCard";
import { CookingActivityCard } from "../components/summary/CookingActivityCard";
import { SavedRecipesCard } from "../components/summary/SavedRecipesCard";
import "../../styles/profile.css";

type Props = {
  token: string;
  onRecipeClick?: (recipeId: number) => void;
  embedded?: boolean;
};

export function SummaryPage({ token, onRecipeClick, embedded = false }: Props) {
  const { summary, loading, error } = useSummary(token);

  const content = (
    <div style={{ display: "grid", gap: 16 }}>
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
          <SummarySection title="Pantry Health" icon="🧺">
            <PantryHealthCard pantryHealth={summary.pantryHealth} />
          </SummarySection>

          <SummarySection title="Cooking Activity" icon="🍳">
            <CookingActivityCard
              cookingActivity={summary.cookingActivity}
              onRecipeClick={onRecipeClick}
            />
          </SummarySection>

          <SummarySection title="Saved Recipes" icon="🔖">
            <SavedRecipesCard
              savedRecipes={summary.savedRecipes}
              onRecipeClick={onRecipeClick}
            />
          </SummarySection>
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