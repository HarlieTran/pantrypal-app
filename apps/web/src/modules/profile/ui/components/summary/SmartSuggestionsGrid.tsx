import type { SummaryPrediction, SummarySuggestion } from "../../../infra/summary.api";

type Props = {
  predictions: SummaryPrediction[];
  suggestions: SummarySuggestion[];
  onSuggestionClick?: (cta: SummarySuggestion["cta"]) => void;
};

function priorityLabel(priority: SummarySuggestion["priority"]) {
  if (priority === "high") return "Do first";
  if (priority === "medium") return "Worth doing";
  return "Optional";
}

function ctaLabel(cta: SummarySuggestion["cta"]) {
  if (cta === "find_recipes") return "Find recipes";
  if (cta === "open_planner") return "Open planner";
  if (cta === "view_pantry") return "View pantry";
  return "View saved recipes";
}

function confidenceLabel(confidence: SummaryPrediction["confidence"]) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Early signal";
}

export function SmartSuggestionsGrid({ predictions, suggestions, onSuggestionClick }: Props) {
  return (
    <div className="profile-intelligence-grid">
      <section className="profile-section-card">
        <div className="profile-section-header">
          <span className="profile-section-icon">✨</span>
          <h3 className="profile-section-title">Smart Suggestions</h3>
        </div>
        <div className="profile-section-body">
          {suggestions.length === 0 ? (
            <p className="profile-summary-empty">No suggestions yet. Add more pantry activity to unlock recommendations.</p>
          ) : (
            <div className="profile-suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <article key={`${suggestion.title}-${index}`} className={`profile-suggestion-card is-${suggestion.priority}`}>
                  <p className="profile-suggestion-priority">{priorityLabel(suggestion.priority)}</p>
                  <h4 className="profile-suggestion-title">{suggestion.title}</h4>
                  <p className="profile-suggestion-body">{suggestion.detail}</p>
                  <button
                    type="button"
                    className="btn-secondary profile-suggestion-cta"
                    onClick={() => onSuggestionClick?.(suggestion.cta)}
                  >
                    {ctaLabel(suggestion.cta)}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="profile-section-card">
        <div className="profile-section-header">
          <span className="profile-section-icon">🔎</span>
          <h3 className="profile-section-title">Signals We See</h3>
        </div>
        <div className="profile-section-body">
          {predictions.length === 0 ? (
            <p className="profile-summary-empty">We need a bit more history before showing stronger patterns.</p>
          ) : (
            <div className="profile-prediction-list">
              {predictions.map((prediction, index) => (
                <article key={`${prediction.title}-${index}`} className="profile-prediction-card">
                  <div className="profile-prediction-header">
                    <h4 className="profile-prediction-title">{prediction.title}</h4>
                    <span className={`profile-prediction-confidence is-${prediction.confidence}`}>
                      {confidenceLabel(prediction.confidence)}
                    </span>
                  </div>
                  <p className="profile-prediction-body">{prediction.detail}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
