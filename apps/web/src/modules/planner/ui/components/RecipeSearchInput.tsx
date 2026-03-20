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
    <div ref={dropdownRef} className="ig-planner-search">
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search saved recipes or type any recipe name..."
        className="ig-planner-search-input"
        disabled={generating}
      />

      {generating && (
        <p className="ig-planner-search-note">
          ✨ Generating recipe with AI...
        </p>
      )}

      {generateError && (
        <p className="ig-planner-search-error">
          {generateError}
        </p>
      )}

      {showDropdown && !generating && (
        <div className="ig-planner-search-dropdown">

          {searching && (
            <p className="ig-planner-search-state">
              Searching...
            </p>
          )}

          {/* Saved recipes tier */}
          {savedResults.length > 0 && (
            <>
              <p className="ig-planner-search-tier">
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
              <p className="ig-planner-search-tier">
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
              <div className="ig-planner-search-divider" />
              <button
                onClick={() => onGenerateFromAI(query.trim())}
                className="ig-planner-generate-option"
              >
                <span>✨</span>
                <span>Generate "{query.trim()}" with AI</span>
              </button>
            </>
          )}

          {/* No results */}
          {!searching && results.length === 0 && query.trim().length > 0 && (
            <p className="ig-planner-search-state">
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
      className="ig-planner-search-row"
    >
      {result.image && (
        <img
          src={result.image}
          alt={result.title}
          className="ig-planner-search-thumb"
        />
      )}
      <div className="ig-planner-search-meta">
        <p className="ig-planner-search-title">
          {result.title}
        </p>
        <p className="ig-planner-search-subtitle">
          {result.isPantryReady ? "✅ Pantry ready" : `${result.totalIngredientCount - result.matchedIngredientCount} ingredients missing`}
          {result.readyMinutes ? ` · ${result.readyMinutes} min` : ""}
        </p>
      </div>
      {result.isSaved && (
        <span className="ig-planner-search-badge">Saved</span>
      )}
    </button>
  );
}
