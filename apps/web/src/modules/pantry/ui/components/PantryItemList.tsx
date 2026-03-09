import { useState } from "react";
import { INGREDIENT_CATEGORIES } from "@pantrypal/shared-types";
import type { PantryItem, PantryItemCategory, ExpiryStatus } from "../../model/pantry.types";
import { CATEGORY_EMOJI } from "../../model/pantry.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: PantryItemCategory[] = [...INGREDIENT_CATEGORIES];

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
    fresh: { label: "Fresh" },
    expiring_soon: { label: days === 0 ? "Today" : `${days}d left` },
    expired: { label: "Expired" },
  }[status];

  return <span className={`pantry-expiry-badge ${status}`}>{config.label}</span>;
}

// ─── Single Item Row ──────────────────────────────────────────────────────────

function PantryItemRow({ item, onDelete }: { item: PantryItem; onDelete: (itemId: string) => void }) {
  return (
    <div className={`pantry-item-row ${item.expiryStatus === "expired" ? "expired" : item.expiryStatus === "expiring_soon" ? "expiring" : ""}`}>
      <div className="pantry-item-info">
        <div className="pantry-item-name-row">
          <span className="pantry-item-name">{item.canonicalName}</span>
          {item.rawName.toLowerCase() !== item.canonicalName.toLowerCase() && (
            <span className="pantry-item-raw-name">({item.rawName})</span>
          )}
        </div>
        <div className="pantry-item-meta">
          {item.quantity} {item.unit}
          {item.expiryDate && <span> · Expires {item.expiryDate}</span>}
          {item.notes && <span> · {item.notes}</span>}
        </div>
      </div>
      <ExpiryBadge status={item.expiryStatus} days={item.daysUntilExpiry} />
      <button onClick={() => onDelete(item.itemId)} title="Remove item" className="pantry-item-delete">✕</button>
    </div>
  );
}

// ─── Category Block ───────────────────────────────────────────────────────────

function CategoryBlock({ category, items, onDelete }: { category: PantryItemCategory; items: PantryItem[]; onDelete: (itemId: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const hasExpired = items.some((i) => i.expiryStatus === "expired");
  const hasExpiringSoon = items.some((i) => i.expiryStatus === "expiring_soon");

  const sorted = [...items].sort((a, b) => {
    const order = { expired: 0, expiring_soon: 1, fresh: 2, no_date: 3 };
    return order[a.expiryStatus] - order[b.expiryStatus];
  });

  return (
    <div className="pantry-category-block">
      <button onClick={() => setCollapsed((prev) => !prev)} className={`pantry-category-header ${hasExpired ? "has-expired" : hasExpiringSoon ? "has-expiring" : ""}`}>
        <span className="pantry-category-emoji">{CATEGORY_EMOJI[category]}</span>
        <div className="pantry-category-info">
          <span className={`pantry-category-label ${hasExpired ? "has-expired" : hasExpiringSoon ? "has-expiring" : ""}`}>
            {CATEGORY_LABEL[category]}
          </span>
          <span className="pantry-category-count">
            {items.length === 0 ? "empty" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
          </span>
          {hasExpired && (
            <span className="pantry-category-urgency expired">
              · {items.filter((i) => i.expiryStatus === "expired").length} expired
            </span>
          )}
          {!hasExpired && hasExpiringSoon && (
            <span className="pantry-category-urgency expiring">
              · {items.filter((i) => i.expiryStatus === "expiring_soon").length} expiring soon
            </span>
          )}
        </div>
        <span className={`pantry-category-chevron ${collapsed ? "collapsed" : ""}`}>⌄</span>
      </button>
      {!collapsed && (
        <div>
          {items.length === 0 ? (
            <div className="pantry-category-empty">No items yet</div>
          ) : (
            sorted.map((item) => <PantryItemRow key={item.itemId} item={item} onDelete={onDelete} />)
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
  const grouped = new Map<PantryItemCategory, PantryItem[]>();
  for (const cat of CATEGORY_ORDER) {
    grouped.set(cat, []);
  }
  for (const item of items) {
    const cat = item.category as PantryItemCategory;
    grouped.get(cat)?.push(item);
  }

  const sortedCategories = [...CATEGORY_ORDER].sort((a, b) => {
    const ua = getCategoryUrgency(grouped.get(a) ?? []);
    const ub = getCategoryUrgency(grouped.get(b) ?? []);
    if (ua !== ub) return ua - ub;
    return CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b);
  });

  return (
    <div className="pantry-list-grid">
      {sortedCategories.map((category) => (
        <CategoryBlock key={category} category={category} items={grouped.get(category) ?? []} onDelete={onDelete} />
      ))}
    </div>
  );
}
