import type { GroceryPlan } from "../../model/planner.types";

type Props = {
  plan: GroceryPlan;
  onRemoveItem: (itemIndex: number) => void;
};

export function GroceryList({ plan, onRemoveItem }: Props) {
  return (
    <div className="ig-planner-grocery">

      {/* Allergen warnings */}
      {plan.allergenWarnings.length > 0 && (
        <div className="ig-planner-warning ig-planner-warning-allergen">
          <p className="ig-planner-warning-title ig-planner-warning-title-allergen">
            ⚠️ Allergen warnings
          </p>
          {plan.allergenWarnings.map((w, i) => (
            <p key={i} className="ig-planner-warning-copy ig-planner-warning-copy-allergen">
              <strong>{w.name}</strong> — contains <strong>{w.allergen}</strong>
              {" "}(in {w.foundIn.join(", ")})
            </p>
          ))}
        </div>
      )}

      {/* Dislike warnings */}
      {plan.dislikeWarnings.length > 0 && (
        <div className="ig-planner-warning ig-planner-warning-dislike">
          <p className="ig-planner-warning-title ig-planner-warning-title-dislike">
            👎 Contains ingredients you dislike
          </p>
          {plan.dislikeWarnings.map((w, i) => (
            <p key={i} className="ig-planner-warning-copy ig-planner-warning-copy-dislike">
              <strong>{w.name}</strong> (in {w.foundIn.join(", ")})
            </p>
          ))}
        </div>
      )}

      {/* To buy */}
      <div>
        <p className="ig-planner-grocery-section-label">
          🛒 To buy ({plan.toBuy.length} items)
        </p>
        {plan.toBuy.length === 0 ? (
          <p className="ig-planner-grocery-empty">
            Nothing to buy — your pantry covers everything!
          </p>
        ) : (
          <div className="ig-planner-grocery-list">
            {plan.toBuy.map((item, i) => (
              <div key={i} className="ig-planner-grocery-item">
                <div>
                  <p className="ig-planner-grocery-copy">
                    {item.name}
                  </p>
                  <p className="ig-planner-grocery-meta">
                    for {item.neededFor.join(", ")}
                  </p>
                </div>
                <div className="ig-planner-grocery-actions">
                  <span className="ig-planner-grocery-qty">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(i)}
                    aria-label={`Remove ${item.name} from grocery list`}
                    className="ig-planner-grocery-remove"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already have */}
      {plan.alreadyHave.length > 0 && (
        <div>
          <p className="ig-planner-grocery-section-label">
            ✅ Already in pantry ({plan.alreadyHave.length} items)
          </p>
          <div className="ig-planner-pantry-list">
            {plan.alreadyHave.map((item, i) => (
              <div key={i} className="ig-planner-pantry-item">
                <div>
                  <p className="ig-planner-pantry-copy">
                    {item.name}
                  </p>
                  <p className="ig-planner-pantry-meta">
                    for {item.neededFor.join(", ")}
                  </p>
                </div>
                <span className="ig-planner-pantry-qty">
                  have {item.pantryQuantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
