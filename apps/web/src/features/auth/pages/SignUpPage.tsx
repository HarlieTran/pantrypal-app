type SignUpPageProps = {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  code: string;
  result: string;
  heroImageSrc: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onGivenNameChange: (value: string) => void;
  onFamilyNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSignUp: () => void;
  onConfirm: () => void;
  onResend: () => void;
  onGoLogin: () => void;
  onBackHome: () => void;
};

export function SignUpPage({
  email,
  password,
  givenName,
  familyName,
  code,
  result,
  heroImageSrc,
  onEmailChange,
  onPasswordChange,
  onGivenNameChange,
  onFamilyNameChange,
  onCodeChange,
  onSignUp,
  onConfirm,
  onResend,
  onGoLogin,
  onBackHome,
}: SignUpPageProps) {
  return (
    <main className="auth-page" style={{ backgroundImage: `url(${heroImageSrc})` }}>
      <div className="auth-overlay">
        <header className="auth-nav">
          <div className="logo">PANTRYPAL</div>
          <button className="text-link" onClick={onBackHome}>Back to Home</button>
        </header>

        <section className="auth-card">
          <p className="label">Create Account</p>
          <h1>Sign Up</h1>
          <div className="auth-grid">
            <input placeholder="email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
            <input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
            <input
              placeholder="given name"
              value={givenName}
              onChange={(e) => onGivenNameChange(e.target.value)}
            />
            <input
              placeholder="family name"
              value={familyName}
              onChange={(e) => onFamilyNameChange(e.target.value)}
            />
            <input
              placeholder="verification code"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
            />
          </div>
          <div className="auth-actions">
            <button onClick={onSignUp}>Create account</button>
            <button onClick={onConfirm}>Confirm code</button>
            <button onClick={onResend}>Resend code</button>
            <button onClick={onGoLogin}>Have account? Login</button>
          </div>
          <pre className="auth-result">{result || " "}</pre>
        </section>
      </div>
    </main>
  );
}
