import type { GroceryPlan } from "../../model/planner.types";

type Props = { plan: GroceryPlan };

export function GroceryList({ plan }: Props) {
  return (
    <div style={{ display: "grid", gap: 16 }}>

      {/* Allergen warnings */}
      {plan.allergenWarnings.length > 0 && (
        <div style={{
          padding: "12px 16px",
          background: "#fff3e0",
          border: "1px solid #ffe0b2",
          borderRadius: 8,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#e65100" }}>
            ⚠️ Allergen warnings
          </p>
          {plan.allergenWarnings.map((w, i) => (
            <p key={i} style={{ margin: "4px 0", fontSize: 13, color: "#e65100" }}>
              <strong>{w.name}</strong> — contains <strong>{w.allergen}</strong>
              {" "}(in {w.foundIn.join(", ")})
            </p>
          ))}
        </div>
      )}

      {/* Dislike warnings */}
      {plan.dislikeWarnings.length > 0 && (
        <div style={{
          padding: "12px 16px",
          background: "#fafafa",
          border: "1px solid #efefef",
          borderRadius: 8,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#737373" }}>
            👎 Contains ingredients you dislike
          </p>
          {plan.dislikeWarnings.map((w, i) => (
            <p key={i} style={{ margin: "4px 0", fontSize: 13, color: "#737373" }}>
              <strong>{w.name}</strong> (in {w.foundIn.join(", ")})
            </p>
          ))}
        </div>
      )}

      {/* To buy */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1,
          textTransform: "uppercase", color: "#737373", marginBottom: 10,
        }}>
          🛒 To buy ({plan.toBuy.length} items)
        </p>
        {plan.toBuy.length === 0 ? (
          <p style={{ fontSize: 13, color: "#737373" }}>
            Nothing to buy — your pantry covers everything!
          </p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {plan.toBuy.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#fafafa",
                  border: "1px solid #efefef",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#262626" }}>
                    {item.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#a8a8a8" }}>
                    for {item.neededFor.join(", ")}
                  </p>
                </div>
                <span style={{ fontSize: 13, color: "#737373", fontWeight: 600 }}>
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already have */}
      {plan.alreadyHave.length > 0 && (
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase", color: "#737373", marginBottom: 10,
          }}>
            ✅ Already in pantry ({plan.alreadyHave.length} items)
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            {plan.alreadyHave.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f0faf0",
                  border: "1px solid #c8e6c9",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2e7d32" }}>
                    {item.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#a8a8a8" }}>
                    for {item.neededFor.join(", ")}
                  </p>
                </div>
                <span style={{ fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>
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