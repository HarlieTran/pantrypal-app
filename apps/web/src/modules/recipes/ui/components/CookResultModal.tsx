import type { CookRecipeResult } from "../../model/recipes.types";
import "../../styles/recipes.css";

interface Props {
  result: CookRecipeResult;
  recipeTitle: string;
  noOp?: boolean;
  onClose: () => void;
  onGoToPantry: () => void;
}

export function CookResultModal({ result, recipeTitle, noOp = false, onClose, onGoToPantry }: Props) {
  return (
    <div onClick={onClose} className="ig-modal-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="ig-modal-card ig-cook-modal">

        <div className="ig-cook-modal-header">
          <div className="ig-cook-modal-header-left">
            <div className="ig-cook-success-icon">{noOp ? "!" : "✓"}</div>
            <div>
              <p className="ig-cook-modal-title">{noOp ? "Nothing to update" : "Pantry updated"}</p>
              <p className="ig-cook-modal-subtitle">{noOp ? "No pantry items matched" : `${recipeTitle} cooked`}</p>
            </div>
          </div>
          <button onClick={onClose} className="ig-modal-close">✕</button>
        </div>

        <div className="ig-cook-stats">
          <div className="ig-cook-stat updated">
            <p className="ig-cook-stat-count">{result.updatedItems.length}</p>
            <p className="ig-cook-stat-label">updated</p>
          </div>
          <div className="ig-cook-stat removed">
            <p className="ig-cook-stat-count">{result.removedItems.length}</p>
            <p className="ig-cook-stat-label">used up</p>
          </div>
          <div className="ig-cook-stat unmatched">
            <p className="ig-cook-stat-count">{result.unmatchedIngredients.length}</p>
            <p className="ig-cook-stat-label">unmatched</p>
          </div>
        </div>

        {result.updatedItems.length > 0 && (
          <>
            <p className="ig-cook-section-label">Quantity reduced</p>
            <div className="ig-cook-item-list">
              {result.updatedItems.map((item) => (
                <div key={item.itemId} className="ig-cook-item-row updated">
                  <span className="ig-cook-item-name">{item.name}</span>
                  <div className="ig-cook-item-qty">
                    <span>{item.beforeQty}</span>
                    <span>→</span>
                    <span className="ig-cook-item-qty-after">{item.afterQty}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {result.removedItems.length > 0 && (
          <>
            <p className="ig-cook-section-label">Removed from pantry</p>
            <div className="ig-cook-item-list">
              {result.removedItems.map((item) => (
                <div key={item.itemId} className="ig-cook-item-row removed">
                  <span className="ig-cook-item-name">{item.name}</span>
                  <span className="ig-cook-item-used-up">fully used up</span>
                </div>
              ))}
            </div>
          </>
        )}

        {result.unmatchedIngredients.length > 0 && (
          <>
            <p className="ig-cook-section-label">Not in pantry</p>
            <div className="ig-cook-chip-list">
              {result.unmatchedIngredients.map((name) => (
                <span key={name} className="ig-cook-chip">{name}</span>
              ))}
            </div>
          </>
        )}

        <div className="ig-cook-modal-footer">
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onGoToPantry}>View pantry →</button>
        </div>
      </div>
    </div>
  );
}
