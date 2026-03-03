import { useState } from "react";
import type { HomeSpecial } from "../types";

type HomeHeroProps = {
  heroImageSrc: string;
  special?: HomeSpecial;
  homeLoading: boolean;
  homeError: string;
  isLoggedIn: boolean;
  onHome: () => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
  onPantryNavigate: () => void;
};

export function HomeHero({
  heroImageSrc,
  special,
  homeLoading,
  homeError,
  isLoggedIn,
  onHome,
  onLogout,
  onLoginNavigate,
  onPantryNavigate,
}: HomeHeroProps) {
  const [openRow, setOpenRow] = useState<"history" | "flavor" | "origin" | null>(null);
  const today = new Date();
  const month = today.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const day = today.getDate();

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(245, 239, 231, 0.26), rgba(245, 239, 231, 0.16)), url(${heroImageSrc})`,
      }}
    >
      <header className="hero-nav">
        <div className="logo">PANTRYPAL</div>
        <nav className="hero-nav-links">
          {isLoggedIn ? (
            <>
              <button className="text-link" onClick={onHome}>Home</button>
              <button className="text-link">Profile</button>
              <button className="text-link" onClick={onPantryNavigate}>Pantry</button>
              <button className="text-link">Community</button>
              <button className="text-link" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="text-link" onClick={onLoginNavigate}>Login</button>
              <button className="text-link">Community</button>
            </>
          )}
        </nav>
      </header>

      <div className="hero-content">
        <article className="special-panel">
          <p className="label">{`TODAY'S SPECIAL · ${month} ${day}`}</p>
          <h1>{special?.dishName || "A new dish is being prepared"}</h1>
          <p className="subhead">
            {`${special?.cuisine || "Global Cuisine"} · ${special?.origin || "World Kitchen"}`}
          </p>
          <div className="panel-divider" />
          <div className="panel-intro">
            <p>{special?.description || "A soulful dish with warm spices, deep comfort, and evening-table charm."}</p>
            <p><strong>Cultural Meaning:</strong> {special?.culturalMeaning || "Not available yet."}</p>
            <p><strong>Inspired By:</strong> {special?.inspiredBy || "Not available yet."}</p>
            <p><strong>Fun Fact:</strong> {special?.funFact || "Not available yet."}</p>
          </div>

          <ul className="special-lines">
            <li>
              <button
                className="row-toggle"
                onClick={() => setOpenRow(openRow === "history" ? null : "history")}
              >
                <div className="row-left">
                  <span className="row-icon">◷</span>
                  <span>HISTORY</span>
                </div>
                <span className="row-chevron">{openRow === "history" ? "⌃" : "⌄"}</span>
              </button>
              {openRow === "history" ? (
                <p className="row-content">{special?.history || "No history details yet."}</p>
              ) : null}
            </li>
            <li>
              <button
                className="row-toggle"
                onClick={() => setOpenRow(openRow === "flavor" ? null : "flavor")}
              >
                <div className="row-left">
                  <span className="row-icon">☺</span>
                  <span>FLAVOR</span>
                </div>
                <span className="row-chevron">{openRow === "flavor" ? "⌃" : "⌄"}</span>
              </button>
              {openRow === "flavor" ? (
                <p className="row-content">
                  {special?.description || "Flavor profile details are not available yet."}
                </p>
              ) : null}
            </li>
            <li>
              <button
                className="row-toggle"
                onClick={() => setOpenRow(openRow === "origin" ? null : "origin")}
              >
                <div className="row-left">
                  <span className="row-icon">◉</span>
                  <span>ORIGIN</span>
                </div>
                <span className="row-chevron">{openRow === "origin" ? "⌃" : "⌄"}</span>
              </button>
              {openRow === "origin" ? (
                <p className="row-content">{special?.origin || "Origin details are not available yet."}</p>
              ) : null}
            </li>
          </ul>

          <div className="panel-cta-row">
            <button className="panel-cta" onClick={onPantryNavigate}>Manage your Pantry</button>
            <button className="panel-cta panel-cta-secondary">Explore the Community</button>
          </div>

          {homeLoading ? <p className="detail">Loading...</p> : null}
          {homeError ? <p className="error">{homeError}</p> : null}
        </article>
      </div>
    </section>
  );
}

