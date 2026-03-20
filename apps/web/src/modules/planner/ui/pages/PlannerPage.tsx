import { useMealPlanner } from "../../application/useMealPlanner";
import { RecipeSearchInput } from "../components/RecipeSearchInput";
import { PlannerRecipeList } from "../components/PlannerRecipeList";
import { GroceryList } from "../components/GroceryList";

type Props = {
  token: string;
  embedded?: boolean;
};

export function PlannerPage({ token, embedded = false }: Props) {
  const {
    query,
    searchResults,
    searching,
    searchError,
    handleQueryChange,
    plannerRecipes,
    addRecipeFromSearch,
    generateRecipe,
    updateServings,
    removeRecipe,
    generating,
    generateError,
    groceryPlan,
    planLoading,
    planError,
    generatePlan,
    removeGroceryItem,
    reset,
  } = useMealPlanner(token);

  const content = (
    <div className="ig-planner-page">

      {/* Header */}
      <header className="ig-toolbar">
        <div className="ig-toolbar-left">
          <div>
            <p><i>Plan your</i></p>
            <h1 className="ig-toolbar-title">Meal Planner</h1>
          </div>
        </div>
        {plannerRecipes.length > 0 && (
          <div className="ig-toolbar-actions">
            <button className="btn-secondary" onClick={reset}>
              Reset
            </button>
          </div>
        )}
      </header>

      {/* Step 1 — Recipe selector */}
      <div className="profile-section-card ig-planner-card-open">
        <div className="profile-section-header">
          <span className="profile-section-icon">🍽️</span>
          <h3 className="profile-section-title">
            Step 1 — Select recipes for your week
          </h3>
        </div>
        <div className="profile-section-body">
          <RecipeSearchInput
            query={query}
            results={searchResults}
            searching={searching}
            generating={generating}
            generateError={generateError}
            onChange={handleQueryChange}
            onSelectFromSearch={addRecipeFromSearch}
            onGenerateFromAI={(name) => void generateRecipe(name)}
          />
          {searchError && (
            <p className="ig-planner-error">
              {searchError}
            </p>
          )}

          {plannerRecipes.length > 0 && (
            <div className="ig-planner-plan-list">
              <p className="ig-planner-section-label">
                Your plan ({plannerRecipes.length} recipe{plannerRecipes.length !== 1 ? "s" : ""})
              </p>
              <PlannerRecipeList
                recipes={plannerRecipes}
                onUpdateServings={updateServings}
                onRemove={removeRecipe}
              />
            </div>
          )}
        </div>
      </div>

      {/* Step 2 — Generate grocery list */}
      {plannerRecipes.length > 0 && (
        <div className="profile-section-card">
          <div className="profile-section-header">
            <span className="profile-section-icon">🛒</span>
            <h3 className="profile-section-title">
              Step 2 — Generate your grocery list
            </h3>
          </div>
          <div className="profile-section-body">
            {!groceryPlan ? (
              <>
                <p className="ig-planner-helper-text">
                  Based on your selected recipes, current pantry, and taste profile.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => void generatePlan()}
                  disabled={planLoading}
                >
                  {planLoading ? "Generating..." : "Generate grocery list →"}
                </button>
                {planError && (
                  <p className="ig-planner-error">
                    {planError}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="ig-planner-summary-bar">
                  <p className="ig-planner-summary-text">
                    {groceryPlan.recipeCount} recipe{groceryPlan.recipeCount !== 1 ? "s" : ""} ·{" "}
                    {groceryPlan.toBuy.length} items to buy ·{" "}
                    {groceryPlan.alreadyHave.length} already in pantry
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={() => void generatePlan()}
                    disabled={planLoading}
                  >
                    Refresh
                  </button>
                </div>
                <GroceryList
                  plan={groceryPlan}
                  onRemoveItem={removeGroceryItem}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {plannerRecipes.length === 0 && (
        <div className="ig-planner-empty">
          <p className="ig-planner-empty-icon">🗓️</p>
          <p className="ig-planner-empty-title">
            Plan your week
          </p>
          <p className="ig-planner-empty-copy">
            Search for recipes above or type any dish name to generate one with AI.
          </p>
        </div>
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
