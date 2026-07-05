import React from "react";
import { WifiOff, X } from "lucide-react";

interface ConnectionErrorModalProps {
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onEditSettings: () => void;
}

export const ConnectionErrorModal: React.FC<ConnectionErrorModalProps> = ({
  error,
  onClose,
  onRetry,
  onEditSettings,
}) => {
  if (!error) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}
      >
        <div className="modal-header">
          <h2
            className="modal-title"
            style={{ color: "var(--accent-error)" }}
          >
            <WifiOff size={20} />
            <span>Connection Failed</span>
          </h2>
          <button
            className="btn-ghost btn-icon-only"
            onClick={onClose}
            aria-label="Close error dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{ textAlign: "center", padding: "24px" }}
        >
          <p
            style={{
              color: "var(--text-main)",
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            An error occurred while connecting to Tuya Cloud:
          </p>
          <div
            style={{
              background: "rgba(244, 63, 94, 0.05)",
              border: "1px dashed rgba(244, 63, 94, 0.2)",
              color: "var(--accent-error)",
              padding: "12px",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              wordBreak: "break-word",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Would you like to retry using your saved credentials, or edit
            them in settings?
          </p>
        </div>

        <div
          className="modal-footer"
          style={{ justifyContent: "center", gap: 12 }}
        >
          <button
            className="btn btn-primary"
            onClick={onRetry}
          >
            Retry Connection
          </button>
          <button
            className="btn btn-secondary"
            onClick={onEditSettings}
          >
            Edit Settings
          </button>
        </div>
      </div>
    </div>
  );
};
