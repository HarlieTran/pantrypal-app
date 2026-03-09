import { useRecipePreferencePicker } from "../../application/useRecipePreferencePicker";

type Props = {
  onPicksComplete: (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => Promise<void>;
  onRequestMore: () => void;
  onBack: () => void;
};

export function RecipePreferencePicker({ onPicksComplete, onRequestMore, onBack }: Props) {
  const { images, selectedIds, loading, saving, error, round, selectedAcrossRounds, toggle, submit, loadMore } = useRecipePreferencePicker();

  const onFinish = async () => {
    try {
      await submit(onPicksComplete);
    } catch {
      // Error already set in hook
    }
  };

  const onMoreRound = () => {
    loadMore();
    onRequestMore();
  };

  return (
    <div>
      <div className="onboarding-header">
        <div>
          <p className="onboarding-step-label">
            Step 2 of 2 {round > 1 ? ` - Round ${round}` : ""}
          </p>
          <h3 className="onboarding-title">Pick recipes you love</h3>
        </div>
      </div>

      {loading ? (
        <p className="picker-loading">Loading recipes...</p>
      ) : (
        <div className="picker-grid">
          {images.map((img) => {
            const active = selectedIds.includes(img.id);
            return (
              <button
                key={img.id}
                onClick={() => toggle(img.id)}
                className={`picker-card ${active ? 'is-active' : ''}`}
              >
                <img src={img.imageUrl} alt={img.title} className="picker-card-image" />
                {active && <div className="picker-card-badge">*</div>}
                <div className="picker-card-content">
                  <p className="picker-card-title">{img.title}</p>
                  <p className="picker-card-cuisine">{img.cuisine ?? "Unknown"}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="picker-count">{selectedAcrossRounds} selected across rounds</p>

      {error && <p className="picker-error">{error}</p>}

      <div>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-primary" onClick={onMoreRound} disabled={saving || loading}>
          More recipes
        </button>
        <button
          className="btn-primary"
          onClick={onFinish}
          disabled={saving || loading || selectedAcrossRounds === 0}
        >
          {saving ? "Saving..." : "Finish"}
        </button>
      </div>
    </div>
  );
}
