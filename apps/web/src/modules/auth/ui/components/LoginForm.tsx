type LoginFormProps = {
  email: string;
  password: string;
  authError: string;
  authLoading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onLogin: () => void;
  onSignUpNavigate: () => void;
};

export function LoginForm({
  email,
  password,
  authError,
  authLoading,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onSignUpNavigate,
}: LoginFormProps) {
  return (
    <section>
      <p className="auth-panel-label">Welcome back</p>
      <h3 className="auth-panel-title">Log in</h3>
      <div className="auth-panel-grid">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoComplete="current-password"
          onKeyDown={(e) => { if (e.key === "Enter") onLogin(); }}
        />
      </div>
      {authError && <p className="auth-panel-error">{authError}</p>}
      <div className="auth-panel-actions-row">
        <button className="btn-primary" onClick={onLogin} disabled={authLoading}>
          {authLoading ? "Logging in…" : "Log in"}
        </button>
      </div>
      <p className="auth-panel-footer">
        Don't have an account?{" "}
        <button onClick={onSignUpNavigate} className="auth-panel-link">Sign up</button>
      </p>
    </section>
  );
}
