import { useEffect, useState } from "react";

type GuestPanelProps = {
  onLoginNavigate: () => void;
};

export function GuestPanel({ onLoginNavigate }: GuestPanelProps) {
  const [typedText, setTypedText] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const fullText = "Make every penny count. Build a smarter pantry and never waste food again.";

  useEffect(() => {
    const runAnimation = () => {
      let index = 0;
      setTypedText("");
      setShowSteps(false);
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setTypedText(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setTimeout(() => setShowSteps(true), 300);
        }
      }, 30);
      return timer;
    };

    const typingTimer = runAnimation();
    const repeatInterval = setInterval(() => {
      runAnimation();
    }, 60000);

    return () => {
      clearInterval(typingTimer);
      clearInterval(repeatInterval);
    };
  }, []);

  return (
    <section className="ig-guest-box">
      <h3>Welcome to PantryPal</h3>
      <p className="ig-guest-copy">
        {typedText}<span className="typing-cursor">|</span>
      </p>
      {showSteps && (
        <div className="ig-steps-container">
          <div className="ig-step-item">
            <div className="ig-step-icon">👤</div>
            <span className="ig-step-text">Create account</span>
          </div>
          <div className="ig-step-arrow">→</div>
          <div className="ig-step-item">
            <div className="ig-step-icon">📸</div>
            <span className="ig-step-text">Scan receipt</span>
          </div>
          <div className="ig-step-arrow">→</div>
          <div className="ig-step-item">
            <div className="ig-step-icon">🍳</div>
            <span className="ig-step-text">Get recipe</span>
          </div>
        </div>
      )}
      <div className="auth-panel-actions">
        <button className="btn-primary" onClick={onLoginNavigate}>Log in</button>
      </div>
    </section>
  );
}
