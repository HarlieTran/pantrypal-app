type VerificationFormProps = {
  email: string;
  code: string;
  authError: string;
  authLoading: boolean;
  onCodeChange: (v: string) => void;
  onConfirm: () => void;
  onResend: () => void;
  onBackToSignup: () => void;
};

export function VerificationForm({
  email,
  code,
  authError,
  authLoading,
  onCodeChange,
  onConfirm,
  onResend,
  onBackToSignup,
}: VerificationFormProps) {
  return (
    <section>
      <p className="auth-panel-label">Verify email</p>
      <h3 className="auth-panel-title">Enter code</h3>
      <p className="auth-panel-footer" style={{ marginBottom: '14px' }}>
        We sent a verification code to {email}
      </p>
      <div className="auth-panel-grid">
        <input
          type="text"
          placeholder="Verification code"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          autoFocus
        />
      </div>
      {authError && <p className="auth-panel-error">{authError}</p>}
      <div className="auth-panel-actions-row">
        <button className="btn-primary" onClick={onConfirm} disabled={authLoading}>
          {authLoading ? "Verifying…" : "Confirm code"}
        </button>
      </div>
      <div className="auth-panel-secondary-actions">
        <button onClick={onResend} className="auth-panel-secondary-link">
          Resend code
        </button>
        <span className="auth-panel-divider">·</span>
        <button onClick={onBackToSignup} className="auth-panel-secondary-link">
          Back to signup
        </button>
      </div>
    </section>
  );
}
