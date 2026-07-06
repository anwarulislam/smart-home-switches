import React from "react";
import { Settings, X, Plus, Loader2, RefreshCw, Database, Download } from "lucide-react";
import type { Device } from "../tuyaApi";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settingsTab: "credentials" | "discovered";
  setSettingsTab: (tab: "credentials" | "discovered") => void;
  config: any;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  onOpenAddSwitches: () => void;
  formAccessId: string;
  setFormAccessId: (val: string) => void;
  formAccessSecret: string;
  setFormAccessSecret: (val: string) => void;
  formRegion: string;
  setFormRegion: (val: string) => void;
  regionOptions: { value: string; label: string }[];
  testStatus: "idle" | "testing" | "success" | "error";
  testErrorMessage: string;
  isLoading: boolean;
  onSaveConfig: (e: React.FormEvent) => void;
  onSyncDevices: () => void;
  onDisconnect: () => void;
  devices: Device[];
  isInstallable?: boolean;
  isInstalled?: boolean;
  onInstallApp?: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settingsTab,
  setSettingsTab,
  config,
  isEditMode,
  setIsEditMode,
  onOpenAddSwitches,
  formAccessId,
  setFormAccessId,
  formAccessSecret,
  setFormAccessSecret,
  formRegion,
  setFormRegion,
  regionOptions,
  testStatus,
  testErrorMessage,
  isLoading,
  onSaveConfig,
  onSyncDevices,
  onDisconnect,
  devices,
  isInstallable = false,
  isInstalled = false,
  onInstallApp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Settings size={20} className="text-indigo-400" />
            <span>Dashboard Control</span>
          </h2>
          <button className="btn-ghost btn-icon-only" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="tabs">
          <div
            className={`tab ${settingsTab === "discovered" ? "active" : ""}`}
            onClick={() => setSettingsTab("discovered")}
          >
            Device Specs ({devices.length})
          </div>
          <div
            className={`tab ${settingsTab === "credentials" ? "active" : ""}`}
            onClick={() => setSettingsTab("credentials")}
          >
            Connection
          </div>
        </div>

        <div className="modal-body">
          {/* PWA Installation Section */}
          {(isInstallable || isInstalled) && (
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                paddingBottom: 16,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                  }}
                >
                  App Installation
                </span>
                <span
                  className={`status-badge ${isInstalled ? "status-online" : "status-offline"}`}
                  style={{
                    backgroundColor: isInstalled ? "rgba(16, 185, 129, 0.1)" : "rgba(99, 102, 241, 0.1)",
                    color: isInstalled ? "var(--accent-success)" : "var(--accent-primary)",
                  }}
                >
                  {isInstalled ? "Installed" : "Installable"}
                </span>
              </div>
              {isInstallable && onInstallApp && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))",
                  }}
                  onClick={onInstallApp}
                >
                  <Download size={16} />
                  <span>Install Smart Life App</span>
                </button>
              )}
            </div>
          )}

          {/* Dashboard Controls (Edit Mode & Add Switch) */}
          {config && (
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                paddingBottom: 16,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                  }}
                >
                  Edit Mode (Rename & Drag-Reorder)
                </span>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={isEditMode}
                    onChange={(e) => setIsEditMode(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={onOpenAddSwitches}
              >
                <Plus size={16} />
                <span>Add Switch Tiles</span>
              </button>
            </div>
          )}

          {settingsTab === "credentials" ? (
            /* Credentials Form inside Settings drawer */
            <form onSubmit={onSaveConfig} style={{ textAlign: "left" }}>
              <div className="form-group">
                <label className="form-label">Access ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formAccessId}
                  onChange={(e) => setFormAccessId(e.target.value)}
                  placeholder="Enter Access ID"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Access Secret</label>
                <input
                  type="password"
                  className="form-input"
                  value={formAccessSecret}
                  onChange={(e) => setFormAccessSecret(e.target.value)}
                  placeholder="Enter Access Secret"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Region Endpoint</label>
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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 24,
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                  disabled={testStatus === "testing"}
                >
                  {testStatus === "testing" ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      <span>Testing & Saving...</span>
                    </>
                  ) : (
                    <span>Verify & Update Credentials</span>
                  )}
                </button>

                {config && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ justifyContent: "center" }}
                    onClick={onSyncDevices}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      size={16}
                      className={isLoading ? "spinning" : ""}
                    />
                    <span>Force Re-sync Devices</span>
                  </button>
                )}

                {config && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ justifyContent: "center", marginTop: 12 }}
                    onClick={onDisconnect}
                  >
                    <span>Disconnect Tuya Account</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* Hardware Details Tab */
            <div className="device-specs-list">
              {devices.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "24px 0",
                  }}
                >
                  <Database
                    size={32}
                    style={{ opacity: 0.3, marginBottom: 8 }}
                  />
                  <p>No discovered devices found.</p>
                </div>
              ) : (
                devices.map((dev) => (
                  <div key={dev.id} className="device-spec-card">
                    <div className="device-spec-header">
                      <h4 className="device-spec-name">{dev.name}</h4>
                      <span className="device-spec-prop">
                        {dev.category}
                      </span>
                    </div>
                    <div className="device-spec-body">
                      <div className="device-spec-row">
                        <span className="device-spec-label">Device ID</span>
                        <span className="device-spec-val">{dev.id}</span>
                      </div>
                      <div className="device-spec-row">
                        <span className="device-spec-label">Status</span>
                        <span
                          className="device-spec-val"
                          style={{
                            color: dev.online
                              ? "var(--accent-success)"
                              : "var(--accent-error)",
                          }}
                        >
                          {dev.online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div className="device-spec-row">
                        <span className="device-spec-label">
                          Product Name
                        </span>
                        <span className="device-spec-val">
                          {dev.product_name}
                        </span>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Functions & Status Codes
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {dev.status.map((stat) => (
                            <div
                              key={stat.code}
                              className="device-spec-row"
                              style={{
                                paddingLeft: 8,
                                borderLeft:
                                  "2px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <span style={{ fontSize: "0.75rem" }}>
                                {stat.name || stat.code}{" "}
                                <span
                                  style={{
                                    color: "var(--text-dark)",
                                    fontSize: "0.65rem",
                                  }}
                                >
                                  ({stat.code})
                                </span>
                              </span>
                              <span
                                className="device-spec-val"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {String(stat.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
