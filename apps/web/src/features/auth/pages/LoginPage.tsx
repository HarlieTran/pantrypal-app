type LoginPageProps = {
  email: string;
  password: string;
  result: string;
  heroImageSrc: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  onGoSignUp: () => void;
  onBackHome: () => void;
};

export function LoginPage({
  email,
  password,
  result,
  heroImageSrc: _heroImageSrc,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onGoSignUp,
  onBackHome,
}: LoginPageProps) {
  return (
    <main className="auth-page">
      <div className="auth-overlay">
        <header className="auth-nav">
          <div className="logo">PANTRYPAL</div>
          <button className="text-link" onClick={onBackHome}>Back to Home</button>
        </header>

        <section className="auth-card">
          <p className="label">Welcome Back</p>
          <h1>Login</h1>
          <div className="auth-grid">
            <input placeholder="email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
            <input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>
          <div className="auth-actions">
            <button className="btn-primary" onClick={onLogin}>Login</button>
            <button className="btn-secondary" onClick={onGoSignUp}>No account? Sign up</button>
          </div>
          <pre className="auth-result">{result || " "}</pre>
        </section>
      </div>
    </main>
  );
}
