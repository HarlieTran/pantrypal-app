import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPantry } from "../../modules/pantry";
import type { HomeSpecial } from "../../modules/home";
import type { PantryItem } from "../../modules/pantry";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";
const DEFAULT_SPECIAL_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2600&q=95";

type HomePayload = {
  todaySpecial?: HomeSpecial;
};

export type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};

function mapExpiringItems(items: PantryItem[]): ExpiringPreviewItem[] {
  return items
    .filter((i) => i.expiryStatus === "expired" || i.expiryStatus === "expiring_soon")
    .sort((a, b) => Number(a.daysUntilExpiry ?? 9999) - Number(b.daysUntilExpiry ?? 9999))
    .slice(0, 5)
    .map((item) => ({
      name: item.canonicalName || item.rawName,
      expiryDate: item.expiryDate,
      daysUntilExpiry: item.daysUntilExpiry,
      status: item.expiryStatus === "expired" ? "expired" : "expiring_soon",
    }));
}

export function useHomeAndPantryPreview(token: string, isLoggedIn: boolean, isBootstrapping: boolean) {
  const [homeData, setHomeData] = useState<HomePayload | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState("");
  const [heroImageBroken, setHeroImageBroken] = useState(false);
  const [expiringItems, setExpiringItems] = useState<ExpiringPreviewItem[]>([]);

  const special = homeData?.todaySpecial;

  const heroImageSrc = useMemo(() => {
    if (special?.imageUrl && !heroImageBroken) return special.imageUrl;
    return DEFAULT_SPECIAL_IMAGE;
  }, [special?.imageUrl, heroImageBroken]);

  useEffect(() => {
    void (async () => {
      try {
        setHomeLoading(true);
        setHomeError("");
        setHeroImageBroken(false);
        const res = await fetch(`${API_BASE}/home`);
        const data = (await res.json()) as HomePayload;
        if (!res.ok) {
          setHomeError(`Failed to load home (${res.status})`);
          return;
        }
        setHomeData(data);
      } catch (e) {
        setHomeError(`Failed to load home: ${String((e as Error).message || e)}`);
      } finally {
        setHomeLoading(false);
      }
    })();
  }, []);

  const refreshExpiringItems = useCallback(async () => {
    if (!isLoggedIn || isBootstrapping) {
      setExpiringItems([]);
      return;
    }
    try {
      const data = await fetchPantry(token);
      setExpiringItems(mapExpiringItems(data.items));
    } catch {
      setExpiringItems([]);
    }
  }, [isLoggedIn, isBootstrapping, token]);

  useEffect(() => {
    void refreshExpiringItems();
  }, [refreshExpiringItems]);

  useEffect(() => {
    if (!special?.imageUrl) {
      setHeroImageBroken(false);
      return;
    }
    const image = new Image();
    image.onload = () => setHeroImageBroken(false);
    image.onerror = () => setHeroImageBroken(true);
    image.src = special.imageUrl;
  }, [special?.imageUrl]);

  return {
    special,
    heroImageSrc,
    homeLoading,
    homeError,
    expiringItems,
    refreshExpiringItems,
  };
}
