import { useRef, useEffect } from "react";
import type { RecipeSearchResult } from "../../model/planner.types";

type Props = {
  query: string;
  results: RecipeSearchResult[];
  searching: boolean;
  generating: boolean;
  generateError: string;
  onChange: (value: string) => void;
  onSelectFromSearch: (result: RecipeSearchResult) => void;
  onGenerateFromAI: (name: string) => void;
};

export function RecipeSearchInput({
  query,
  results,
  searching,
  generating,
  generateError,
  onChange,
  onSelectFromSearch,
  onGenerateFromAI,
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const showDropdown = query.trim().length > 0 || results.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onChange("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onChange]);

  const savedResults = results.filter((r) => r.isSaved);
  const otherResults = results.filter((r) => !r.isSaved);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search saved recipes or type any recipe name..."
        style={{ width: "100%", boxSizing: "border-box" }}
        disabled={generating}
      />

      {generating && (
        <p style={{ fontSize: 13, color: "#737373", marginTop: 6 }}>
          ✨ Generating recipe with AI...
        </p>
      )}

      {generateError && (
        <p style={{ fontSize: 13, color: "#b71c1c", marginTop: 6 }}>
          {generateError}
        </p>
      )}

      {showDropdown && !generating && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #dbdbdb",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100,
          maxHeight: 360,
          overflowY: "auto",
          marginTop: 4,
        }}>

          {searching && (
            <p style={{ padding: "12px 16px", fontSize: 13, color: "#737373" }}>
              Searching...
            </p>
          )}

          {/* Saved recipes tier */}
          {savedResults.length > 0 && (
            <>
              <p style={{
                padding: "8px 16px 4px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#a8a8a8",
              }}>
                Your saved recipes
              </p>
              {savedResults.map((r) => (
                <DropdownRow
                  key={r.id}
                  result={r}
                  onSelect={onSelectFromSearch}
                />
              ))}
            </>
          )}

          {/* Other DB recipes tier */}
          {otherResults.length > 0 && (
            <>
              <p style={{
                padding: "8px 16px 4px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#a8a8a8",
              }}>
                Other recipes
              </p>
              {otherResults.map((r) => (
                <DropdownRow
                  key={r.id}
                  result={r}
                  onSelect={onSelectFromSearch}
                />
              ))}
            </>
          )}

          {/* AI generation tier */}
          {query.trim().length > 0 && !searching && (
            <>
              <div style={{
                height: 1,
                background: "#efefef",
                margin: "4px 0",
              }} />
              <button
                onClick={() => onGenerateFromAI(query.trim())}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#dc2743",
                  fontWeight: 600,
                }}
              >
                <span>✨</span>
                <span>Generate "{query.trim()}" with AI</span>
              </button>
            </>
          )}

          {/* No results */}
          {!searching && results.length === 0 && query.trim().length > 0 && (
            <p style={{ padding: "8px 16px", fontSize: 13, color: "#737373" }}>
              No saved recipes match — use AI to generate it
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownRow({
  result,
  onSelect,
}: {
  result: RecipeSearchResult;
  onSelect: (r: RecipeSearchResult) => void;
}) {
  return (
    <button
      onClick={() => onSelect(result)}
      style={{
        width: "100%",
        padding: "10px 16px",
        textAlign: "left",
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {result.image && (
        <img
          src={result.image}
          alt={result.title}
          style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#262626" }}>
          {result.title}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#737373" }}>
          {result.isPantryReady ? "✅ Pantry ready" : `${result.totalIngredientCount - result.matchedIngredientCount} ingredients missing`}
          {result.readyMinutes ? ` · ${result.readyMinutes} min` : ""}
        </p>
      </div>
      {result.isSaved && (
        <span style={{ fontSize: 11, color: "#dc2743", fontWeight: 600 }}>Saved</span>
      )}
    </button>
  );
}