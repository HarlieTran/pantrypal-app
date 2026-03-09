type SignupFormProps = {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  authError: string;
  authLoading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onGivenNameChange: (v: string) => void;
  onFamilyNameChange: (v: string) => void;
  onSignUp: () => void;
  onLoginNavigate: () => void;
};

export function SignupForm({
  email,
  password,
  givenName,
  familyName,
  authError,
  authLoading,
  onEmailChange,
  onPasswordChange,
  onGivenNameChange,
  onFamilyNameChange,
  onSignUp,
  onLoginNavigate,
}: SignupFormProps) {
  return (
    <section>
      <p className="auth-panel-label">Create account</p>
      <h3 className="auth-panel-title">Sign up</h3>
      <div className="auth-panel-grid">
        <div className="auth-panel-grid-2col">
          <input
            type="text"
            placeholder="First name"
            value={givenName}
            onChange={(e) => onGivenNameChange(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last name"
            value={familyName}
            onChange={(e) => onFamilyNameChange(e.target.value)}
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      {authError && <p className="auth-panel-error">{authError}</p>}
      <div className="auth-panel-actions-row">
        <button className="btn-primary" onClick={onSignUp} disabled={authLoading}>
          {authLoading ? "Creating…" : "Create account"}
        </button>
      </div>
      <p className="auth-panel-footer">
        Already have an account?{" "}
        <button onClick={onLoginNavigate} className="auth-panel-link">Log in</button>
      </p>
    </section>
  );
}
