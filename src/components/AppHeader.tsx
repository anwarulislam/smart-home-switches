import React from "react";
import { Settings, RefreshCw, Sparkles } from "lucide-react";

interface AppHeaderProps {
  hasConfig: boolean;
  isLoading: boolean;
  onSync: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  hasConfig,
  isLoading,
  onSync,
  onOpenSettings,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <h1 className="brand-title">Smart Life</h1>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: -4,
            }}
          >
            Smart Switch Dashboard
          </p>
        </div>
      </div>

      <div className="header-actions">
        {hasConfig && (
          <button
            className="btn btn-secondary btn-icon-only"
            onClick={onSync}
            disabled={isLoading}
            title="Sync devices"
          >
            <RefreshCw size={18} className={isLoading ? "spinning" : ""} />
          </button>
        )}
        <button
          className="btn btn-secondary btn-icon-only"
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
