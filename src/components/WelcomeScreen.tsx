import React from "react";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";

interface WelcomeScreenProps {
  formAccessId: string;
  setFormAccessId: (val: string) => void;
  formAccessSecret: string;
  setFormAccessSecret: (val: string) => void;
  formRegion: string;
  setFormRegion: (val: string) => void;
  regionOptions: { value: string; label: string }[];
  testStatus: "idle" | "testing" | "success" | "error";
  testErrorMessage: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  formAccessId,
  setFormAccessId,
  formAccessSecret,
  setFormAccessSecret,
  formRegion,
  setFormRegion,
  regionOptions,
  testStatus,
  testErrorMessage,
  onSubmit,
}) => {
  return (
    <div className="welcome-container">
      <div className="welcome-logo-large">
        <Sparkles size={40} />
      </div>
      <h2 className="welcome-title">Connect Tuya Cloud</h2>
      <p className="welcome-desc">
        Please enter your Tuya Open Platform credentials to discover and
        control smart switches on your local dashboard.
      </p>

      <form onSubmit={onSubmit} style={{ width: "100%", textAlign: "left" }}>
        <div className="form-group">
          <label className="form-label">Access ID (Client ID)</label>
          <input
            type="text"
            className="form-input"
            value={formAccessId}
            onChange={(e) => setFormAccessId(e.target.value)}
            placeholder="e.g. 7wyx..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Access Secret (Client Secret)</label>
          <input
            type="password"
            className="form-input"
            value={formAccessSecret}
            onChange={(e) => setFormAccessSecret(e.target.value)}
            placeholder="e.g. 4d8b..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">API Region Server</label>
          <select
            className="form-select"
            value={formRegion}
            onChange={(e) => setFormRegion(e.target.value)}
          >
            {regionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="form-help">
            Select the region matching your Tuya Cloud Smart Home project.
          </p>
        </div>

        {testStatus === "error" && (
          <div
            style={{
              color: "var(--accent-error)",
              fontSize: "0.85rem",
              marginBottom: 16,
            }}
          >
            ❌ {testErrorMessage}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "12px",
          }}
          disabled={testStatus === "testing"}
        >
          {testStatus === "testing" ? (
            <>
              <Loader2 size={18} className="spinning" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <span>Connect & Fetch Devices</span>
          )}
        </button>
      </form>

      <div
        style={{
          marginTop: 24,
          fontSize: "0.75rem",
          color: "var(--text-dark)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span>
          Secure Connection: API keys are stored base64 encrypted in localStorage.
        </span>
        <a
          href="https://platform.tuya.com/"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--accent-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          Tuya IoT Platform <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};
