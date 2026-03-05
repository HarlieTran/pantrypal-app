import { useState } from "react";
import type { PantryItem, PantryItemCategory, ExpiryStatus } from "../../model/pantry.types";
import { CATEGORY_EMOJI } from "../../model/pantry.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: PantryItemCategory[] = [
  "produce", "dairy", "meat", "seafood", "grains",
  "spices", "condiments", "frozen", "beverages", "snacks", "other",
];

const CATEGORY_LABEL: Record<PantryItemCategory, string> = {
  produce: "Produce",
  dairy: "Dairy & Eggs",
  meat: "Meat & Poultry",
  seafood: "Seafood",
  grains: "Grains & Bread",
  spices: "Spices & Herbs",
  condiments: "Condiments & Oils",
  frozen: "Frozen",
  beverages: "Beverages",
  snacks: "Snacks",
  other: "Other",
};

// ─── Expiry Badge ─────────────────────────────────────────────────────────────

function ExpiryBadge({ status, days }: { status: ExpiryStatus; days?: number }) {
  if (status === "no_date") return null;

  const config = {
    fresh: { bg: "#e8f5e9", color: "#2e7d32", label: "Fresh" },
    expiring_soon: {
      bg: "#fff3e0",
      color: "#e65100",
      label: days === 0 ? "Today" : `${days}d left`,
    },
    expired: { bg: "#fce4ec", color: "#b71c1c", label: "Expired" },
  }[status];

  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: "20px",
      backgroundColor: config.bg,
      color: config.color,
      whiteSpace: "nowrap",
    }}>
      {config.label}
    </span>
  );
}

// ─── Single Item Row ──────────────────────────────────────────────────────────

function PantryItemRow({
  item,
  onDelete,
}: {
  item: PantryItem;
  onDelete: (itemId: string) => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 16px",
      borderTop: "1px solid var(--line)",
      backgroundColor:
        item.expiryStatus === "expired"
          ? "rgba(183,28,28,0.03)"
          : item.expiryStatus === "expiring_soon"
          ? "rgba(230,81,0,0.03)"
          : "transparent",
      transition: "background 0.15s",
    }}>
      {/* Name + raw name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
            {item.canonicalName}
          </span>

          {item.rawName.toLowerCase() !== item.canonicalName.toLowerCase() && (
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              ({item.rawName})
            </span>
          )}
        </div>

        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
          {item.quantity} {item.unit}
          {item.expiryDate && <span> · Expires {item.expiryDate}</span>}
          {item.notes && <span> · {item.notes}</span>}
        </div>
      </div>

      {/* Expiry badge */}
      <ExpiryBadge status={item.expiryStatus} days={item.daysUntilExpiry} />

      {/* Delete button */}
      <button
        onClick={() => onDelete(item.itemId)}
        title="Remove item"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "var(--muted)",
          padding: "4px 8px",
          borderRadius: "8px",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#b71c1c";
          e.currentTarget.style.background = "rgba(183,28,28,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "none";
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Category Block ───────────────────────────────────────────────────────────

function CategoryBlock({
  category,
  items,
  onDelete,
}: {
  category: PantryItemCategory;
  items: PantryItem[];
  onDelete: (itemId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const hasExpired = items.some((i) => i.expiryStatus === "expired");
  const hasExpiringSoon = items.some((i) => i.expiryStatus === "expiring_soon");

  // Sort items within category by urgency
  const sorted = [...items].sort((a, b) => {
    const order = { expired: 0, expiring_soon: 1, fresh: 2, no_date: 3 };
    return order[a.expiryStatus] - order[b.expiryStatus];
  });

  const headerAccent = hasExpired
    ? "#b71c1c"
    : hasExpiringSoon
    ? "#e65100"
    : "var(--muted)";

  const headerBg = hasExpired
    ? "rgba(183,28,28,0.04)"
    : hasExpiringSoon
    ? "rgba(230,81,0,0.04)"
    : "transparent";

  return (
    <div style={{
      border: "1px solid var(--line)",
      borderRadius: "5px",
      overflow: "hidden",
      background: "var(--panel)",
    }}>
      {/* Category header */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: headerBg,
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(90,74,55,0.05)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = headerBg)
        }
      >
        {/* Emoji */}
        <span style={{ fontSize: "20px" }}>
          {CATEGORY_EMOJI[category]}
        </span>

        {/* Label + count */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: headerAccent,
          }}>
            {CATEGORY_LABEL[category]}
          </span>
          <span style={{
            marginLeft: "8px",
            fontSize: "11px",
            color: "var(--muted)",
          }}>
            {items.length === 0
              ? "empty"
              : `${items.length} item${items.length !== 1 ? "s" : ""}`}
          </span>

          {/* Urgency hint */}
          {hasExpired && (
            <span style={{
              marginLeft: "8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#b71c1c",
            }}>
              · {items.filter((i) => i.expiryStatus === "expired").length} expired
            </span>
          )}
          {!hasExpired && hasExpiringSoon && (
            <span style={{
              marginLeft: "8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#e65100",
            }}>
              · {items.filter((i) => i.expiryStatus === "expiring_soon").length} expiring soon
            </span>
          )}
        </div>

        {/* Collapse chevron */}
        <span style={{
          fontSize: "12px",
          color: "var(--muted)",
          transition: "transform 0.2s",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        }}>
          ⌄
        </span>
      </button>

      {/* Items list */}
      {!collapsed && (
        <div>
          {items.length === 0 ? (
            <div style={{
              padding: "12px 16px 14px 48px",
              fontSize: "13px",
              color: "var(--muted)",
              fontStyle: "italic",
            }}>
              No items yet
            </div>
          ) : (
            sorted.map((item) => (
              <PantryItemRow
                key={item.itemId}
                item={item}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category sort ────────────────────────────────────────────────────────────

function getCategoryUrgency(items: PantryItem[]): number {
  if (items.some((i) => i.expiryStatus === "expired")) return 0;
  if (items.some((i) => i.expiryStatus === "expiring_soon")) return 1;
  if (items.length === 0) return 3;
  return 2;
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  items: PantryItem[];
  onDelete: (itemId: string) => void;
}

export function PantryItemList({ items, onDelete }: Props) {
  // Group items by category
  const grouped = new Map<PantryItemCategory, PantryItem[]>();
  for (const cat of CATEGORY_ORDER) {
    grouped.set(cat, []);
  }
  for (const item of items) {
    const cat = item.category as PantryItemCategory;
    grouped.get(cat)?.push(item);
  }

  // Sort categories by urgency first, then fixed order
  const sortedCategories = [...CATEGORY_ORDER].sort((a, b) => {
    const ua = getCategoryUrgency(grouped.get(a) ?? []);
    const ub = getCategoryUrgency(grouped.get(b) ?? []);
    if (ua !== ub) return ua - ub;
    return CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b);
  });

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "12px",
      padding: "16px",
    }}>
      {sortedCategories.map((category) => (
        <CategoryBlock
          key={category}
          category={category}
          items={grouped.get(category) ?? []}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
