type HomeSidebarProps = {
  centerView: "home" | "pantry" | "recipes" | "profile" | "edit-profile" | "community" | "summary";
  isLoggedIn: boolean;
  onHome: () => void;
  onPantryNavigate: () => void;
  onRecipesNavigate: () => void;
  onProfileNavigate: () => void;
  onSummaryNavigate: () => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
};

export function HomeSidebar({
  centerView,
  isLoggedIn,
  onHome,
  onPantryNavigate,
  onRecipesNavigate,
  onProfileNavigate,
  onSummaryNavigate,
  onLogout,
  onLoginNavigate,
}: HomeSidebarProps) {
  return (
    <aside className="ig-left-rail">
      <div className="ig-left-logo">PantryPal</div>
      <nav className="ig-left-nav">
        <button className={`ig-left-link${centerView === "home" ? " is-active" : ""}`} onClick={onHome}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
          </svg>
          <span className="ig-left-text">Home</span>
        </button>

        {isLoggedIn ? (
          <>
            <button className={`ig-left-link${centerView === "pantry" ? " is-active" : ""}`} onClick={onPantryNavigate}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6-.354.353V14.5A1.5 1.5 0 0 0 2.5 16h11a1.5 1.5 0 0 0 1.5-1.5V7.5l-.354-.354zM11 13H9v-2H7v2H5V7.207l3-3 3 3z"/>
              </svg>
              <span className="ig-left-text">Pantry</span>
            </button>

            <button className={`ig-left-link${centerView === "recipes" ? " is-active" : ""}`} onClick={onRecipesNavigate}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v11.5a.5.5 0 0 1-.777.416L8 11.101l-4.223 2.815A.5.5 0 0 1 3 13.5zm1 0v10.566l3.723-2.482a.5.5 0 0 1 .554 0L12 12.566V2z"/>
              </svg>
              <span className="ig-left-text">Recipes</span>
            </button>

            <button
              className={`ig-left-link${centerView === "summary" ? " is-active" : ""}`}
              onClick={onSummaryNavigate}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 0h1v15h15v1H0zm14.854 5.854a.5.5 0 0 0-.708-.708L7 12.293 4.854 10.146a.5.5 0 0 0-.708.708l2.5 2.5a.5.5 0 0 0 .708 0z"/>
              </svg>
              <span className="ig-left-text">Summary</span>
            </button>

            <button className={`ig-left-link${centerView === "profile" || centerView === "edit-profile" ? " is-active" : ""}`} onClick={onProfileNavigate}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              <span className="ig-left-text">Profile</span>
            </button>

            <button className="ig-left-link left-nav-logout" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
              </svg>
              <span className="ig-left-text">Logout</span>
            </button>
          </>
        ) : (
          <button className="ig-left-link" onClick={onLoginNavigate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
              <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
            </svg>
            <span className="ig-left-text">Login</span>
          </button>
        )}
      </nav>
    </aside>
  );
}
