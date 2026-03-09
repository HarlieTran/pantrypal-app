import { useState } from "react";
import type { HomeSpecial } from "../../model/home.types";

type DailySpecialCardProps = {
  special?: HomeSpecial;
  heroImageSrc: string;
  avatarLabel: string;
  todayLabel: string;
  homeLoading: boolean;
  homeError: string;
};

export function DailySpecialCard({
  special,
  heroImageSrc,
  avatarLabel,
  todayLabel,
  homeLoading,
  homeError,
}: DailySpecialCardProps) {
  const [openRow, setOpenRow] = useState<"history" | "flavor" | "origin" | null>(null);

  return (
    <article className="ig-post-card">
      <div className="ig-post-head">
        <div className="ig-avatar ig-avatar-sm">{avatarLabel}</div>
        <div>
          <h2>{special?.dishName || "A new dish is being prepared"}</h2>
          <p>{todayLabel}</p>
        </div>
      </div>
      <div className="ig-post-image-wrap">
        <img src={heroImageSrc} alt={special?.dishName || "Today's recipe"} className="ig-post-image" />
      </div>
      <div className="ig-post-body">
        <p className="ig-post-caption">
          {special?.description || "A new dish is being prepared. Stay tuned for today's recipe details."}
        </p>
        <p className="ig-post-meta">
          {`${special?.cuisine || "Global Cuisine"} - ${special?.origin || "World Kitchen"}`}
        </p>
        <ul className="special-lines">
          {(["history", "flavor", "origin"] as const).map((row) => (
            <li key={row}>
              <button className="row-toggle" onClick={() => setOpenRow(openRow === row ? null : row)}>
                <span className="row-left" style={{ textTransform: "capitalize" }}>{row}</span>
                <span className="row-chevron">{openRow === row ? "^" : "v"}</span>
              </button>
              {openRow === row && (
                <p className="row-content">
                  {row === "history"
                    ? special?.history || "No history details yet."
                    : row === "flavor"
                    ? special?.description || "Flavor profile not available yet."
                    : special?.origin || "Origin details not available yet."}
                </p>
              )}
            </li>
          ))}
        </ul>
        {homeLoading && <p className="post-loading-text">Loading today's recipe...</p>}
        {homeError && <p className="error">{homeError}</p>}
      </div>
    </article>
  );
}
