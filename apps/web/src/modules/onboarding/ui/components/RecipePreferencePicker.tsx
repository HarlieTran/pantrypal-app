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
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
            Step 2 of 2 {round > 1 ? ` - Round ${round}` : ""}
          </p>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "2px 0 0", letterSpacing: "-0.3px" }}>
            Pick recipes you love
          </h3>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
          Loading recipes...
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "55vh", overflowY: "auto" }}>
          {images.map((img) => {
            const active = selectedIds.includes(img.id);
            return (
              <button
                key={img.id}
                onClick={() => toggle(img.id)}
                style={{
                  border: active ? "2px solid #dc2743" : "1.5px solid var(--line)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "var(--panel)",
                  padding: 0,
                  cursor: "pointer",
                  position: "relative",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: active ? "0 0 0 2px rgba(220,39,67,0.15)" : "none",
                  textAlign: "left",
                }}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  style={{ width: "100%", height: "90px", objectFit: "cover", display: "block" }}
                />
                {active ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#dc2743",
                      color: "#fff",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    *
                  </div>
                ) : null}
                <div style={{ padding: "6px 8px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>
                    {img.title}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--muted)", margin: "2px 0 0" }}>
                    {img.cuisine ?? "Unknown"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "10px 0 0", textAlign: "center" }}>
        {selectedAcrossRounds} selected across rounds
      </p>

      {error ? <p style={{ fontSize: "12px", color: "var(--error)", marginTop: "8px" }}>{error}</p> : null}

      <div>
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
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
