import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import {
  Settings,
  Plus,
  Trash2,
  Lightbulb,
  Loader2,
  RefreshCw,
  X,
  Search,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Database,
  WifiOff,
} from "lucide-react";
import {
  getSavedConfig,
  saveConfig,
  clearConfig,
  getCachedDevices,
  saveCachedDevices,
  getActiveSwitches,
  saveActiveSwitches,
  fetchDevices,
  sendDeviceCommand,
  isSwitchableCommand,
  getRenamedSwitches,
  saveRenamedSwitches,
} from "./tuyaApi";
import type { TuyaConfig, Device } from "./tuyaApi";
import { DashboardTile } from "./components/DashboardTile";

const REGION_OPTIONS = [
  { value: "https://openapi.tuyaeu.com", label: "Central Europe Data Center" },
  { value: "https://openapi.tuyaus.com", label: "Western America Data Center" },
  { value: "https://openapi.tuyain.com", label: "India Data Center" },
  {
    value: "https://openapi-weaz.tuyaeu.com",
    label: "Western Europe Data Center",
  },
  { value: "https://openapi.tuyacn.com", label: "China Data Center" },
  {
    value: "https://openapi-ueaz.tuyaus.com",
    label: "Eastern America Data Center",
  },
];

export default function App() {
  // App States
  const [config, setConfig] = useState<TuyaConfig | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeSwitches, setActiveSwitches] = useState<
    { deviceId: string; code: string }[]
  >([]);
  const [renamedSwitches, setRenamedSwitches] = useState<
    Record<string, string>
  >({});

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddSwitchOpen, setIsAddSwitchOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<"credentials" | "discovered">(
    "discovered",
  );

  // FLIP layout animation references
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  const prevLayoutRects = useRef<Record<string, DOMRect>>({});

  // Settings Form State
  const [formAccessId, setFormAccessId] = useState(() => {
    const saved = getSavedConfig();
    return saved ? saved.accessId : "";
  });
  const [formAccessSecret, setFormAccessSecret] = useState(() => {
    const saved = getSavedConfig();
    return saved ? saved.accessSecret : "";
  });
  const [formRegion, setFormRegion] = useState(() => {
    const saved = getSavedConfig();
    return saved ? saved.region : REGION_OPTIONS[0].value;
  });
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testErrorMessage, setTestErrorMessage] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Toggling lock list (deviceId:code) to prevent double trigger and show load state
  const [togglingKeys, setTogglingKeys] = useState<Set<string>>(new Set());

  // Custom Toast State
  const [toasts, setToasts] = useState<
    { id: string; text: string; type: "success" | "error" }[]
  >([]);

  // Load Initial Settings & Cache
  useEffect(() => {
    const savedConfig = getSavedConfig();
    const names = getRenamedSwitches();
    setRenamedSwitches(names);

    if (savedConfig) {
      setConfig(savedConfig);
      setFormAccessId(savedConfig.accessId);
      setFormAccessSecret(savedConfig.accessSecret);
      setFormRegion(savedConfig.region);

      const cached = getCachedDevices();
      if (cached.length > 0) {
        setDevices(cached);
        // Stale-while-revalidate: load from cache instantly, sync in the background
        handleSyncDevices(savedConfig, true);
      } else {
        handleSyncDevices(savedConfig, false);
      }

      const active = getActiveSwitches();
      setActiveSwitches(active);
    }
  }, []);

  // Show customized toasts
  const showToast = (text: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Sync devices from Tuya OpenAPI
  const handleSyncDevices = async (targetConfig = config, silent = false) => {
    const activeConfig = targetConfig || config || getSavedConfig();
    if (!activeConfig) return;
    setIsLoading(true);
    setConnectionError(null);
    try {
      if (!silent) {
        showToast("Fetching latest switches from Tuya...", "success");
      }
      const latestDevices = await fetchDevices(activeConfig);
      setDevices(latestDevices);
      saveCachedDevices(latestDevices);
      if (!silent) {
        showToast(
          `Synced ${latestDevices.length} devices successfully!`,
          "success",
        );
      }
    } catch (e: any) {
      console.error(e);
      setConnectionError(e.message || "Failed to sync switches");
      showToast(e.message || "Failed to sync switches", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Save Config and test it
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAccessId || !formAccessSecret || !formRegion) {
      showToast("All settings fields are required", "error");
      return;
    }

    setTestStatus("testing");
    setTestErrorMessage("");

    const newConfig: TuyaConfig = {
      accessId: formAccessId.trim(),
      accessSecret: formAccessSecret.trim(),
      region: formRegion,
    };

    try {
      // Fetch devices as a verification test
      const testDevs = await fetchDevices(newConfig);
      setTestStatus("success");
      saveConfig(newConfig);
      setConfig(newConfig);
      setDevices(testDevs);
      saveCachedDevices(testDevs);

      showToast("Credentials verified and saved!", "success");

      // Auto-close settings modal on fresh configuration
      setTimeout(() => {
        setIsSettingsOpen(false);
        setTestStatus("idle");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setTestStatus("error");
      setTestErrorMessage(
        err.message || "Verification failed. Please double check credentials.",
      );
      showToast("Configuration verification failed", "error");
    }
  };

  // Logout/Reset
  const handleDisconnect = () => {
    if (
      window.confirm(
        "Are you sure you want to log out? This will clear your credentials and dashboard switches.",
      )
    ) {
      clearConfig();
      setConfig(null);
      setDevices([]);
      setActiveSwitches([]);
      setRenamedSwitches({});
      setIsEditMode(false);
      setDraggedKey(null);
      setDragOverKey(null);
      setFormAccessId("");
      setFormAccessSecret("");
      setFormRegion(REGION_OPTIONS[0].value);
      setIsSettingsOpen(false);
      showToast("Account disconnected and cache cleared", "success");
    }
  };

  // Rename a switch tile
  const handleRenameSwitch = (
    deviceId: string,
    code: string,
    newName: string,
  ) => {
    const key = `${deviceId}:${code}`;
    const updatedNames = { ...renamedSwitches };
    if (newName) {
      updatedNames[key] = newName;
    } else {
      delete updatedNames[key];
    }
    setRenamedSwitches(updatedNames);
    saveRenamedSwitches(updatedNames);
    showToast("Switch renamed successfully", "success");
  };

  // Drag and drop reordering handlers
  const handleDragStart = (key: string) => {
    setDraggedKey(key);
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDrop = (targetKey: string) => {
    setDragOverKey(null);
    if (draggedKey === null || draggedKey === targetKey) return;

    const draggedIndex = activeSwitches.findIndex(
      (s) => `${s.deviceId}:${s.code}` === draggedKey,
    );
    const targetIndex = activeSwitches.findIndex(
      (s) => `${s.deviceId}:${s.code}` === targetKey,
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reorderedSwitches = [...activeSwitches];
    const [draggedItem] = reorderedSwitches.splice(draggedIndex, 1);
    reorderedSwitches.splice(targetIndex, 0, draggedItem);

    captureLayout();
    setActiveSwitches(reorderedSwitches);
    saveActiveSwitches(reorderedSwitches);
    setDraggedKey(null);
  };

  const getDragOverSide = (key: string): "left" | "right" | null => {
    if (draggedKey === null || dragOverKey !== key || draggedKey === key) return null;

    const draggedIndex = activeSwitches.findIndex(
      (s) => `${s.deviceId}:${s.code}` === draggedKey,
    );
    const targetIndex = activeSwitches.findIndex(
      (s) => `${s.deviceId}:${s.code}` === key,
    );

    if (draggedIndex === -1 || targetIndex === -1) return null;
    return draggedIndex > targetIndex ? "left" : "right";
  };

  // FLIP layout layout capturing helper
  const captureLayout = () => {
    if (!tilesContainerRef.current) return;
    const rects: Record<string, DOMRect> = {};
    const children = tilesContainerRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const key = child.getAttribute("data-key");
      if (key) {
        rects[key] = child.getBoundingClientRect();
      }
    }
    prevLayoutRects.current = rects;
  };

  useLayoutEffect(() => {
    if (!tilesContainerRef.current || Object.keys(prevLayoutRects.current).length === 0) return;

    const children = tilesContainerRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const key = child.getAttribute("data-key");
      if (!key) continue;

      const first = prevLayoutRects.current[key];
      if (!first) continue;

      const last = child.getBoundingClientRect();
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;

      if (deltaX !== 0 || deltaY !== 0) {
        // Invert: position element back to its first position instantly
        child.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        child.style.transition = "none";

        // Play: animate back to its natural last position
        requestAnimationFrame(() => {
          child.style.transform = "";
          child.style.transition = "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
          
          setTimeout(() => {
            if (child) {
              child.style.transition = "";
            }
          }, 400);
        });
      }
    }
    // Clear layout state
    prevLayoutRects.current = {};
  }, [activeSwitches]);

  // Add a switch tile to the homepage
  const handleAddSwitch = (deviceId: string, code: string) => {
    const alreadyExists = activeSwitches.some(
      (a) => a.deviceId === deviceId && a.code === code,
    );
    if (alreadyExists) return;

    const newActive = [...activeSwitches, { deviceId, code }];
    captureLayout();
    setActiveSwitches(newActive);
    saveActiveSwitches(newActive);
    showToast("Tile added to dashboard", "success");
  };

  // Remove a switch tile from the homepage
  const handleRemoveSwitch = (
    deviceId: string,
    code: string,
    event?: React.MouseEvent,
  ) => {
    if (event) event.stopPropagation(); // Avoid triggering switch toggle

    const newActive = activeSwitches.filter(
      (a) => !(a.deviceId === deviceId && a.code === code),
    );
    captureLayout();
    setActiveSwitches(newActive);
    saveActiveSwitches(newActive);
    showToast("Tile removed from dashboard", "success");
  };

  // Control switch command trigger (Toggle switch)
  const handleToggleSwitch = async (
    deviceId: string,
    code: string,
    currentValue: boolean,
  ) => {
    const key = `${deviceId}:${code}`;
    if (togglingKeys.has(key)) return;

    // Set toggle lock
    setTogglingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    // Optimistically update state in UI
    const originalDevices = [...devices];
    setDevices((prevDevices) =>
      prevDevices.map((d) => {
        if (d.id === deviceId) {
          return {
            ...d,
            status: d.status.map((s) => {
              if (s.code === code) {
                return { ...s, value: !currentValue };
              }
              return s;
            }),
          };
        }
        return d;
      }),
    );

    try {
      const success = await sendDeviceCommand(
        config!,
        deviceId,
        code,
        !currentValue,
      );
      if (success) {
        // Update local storage cache
        setDevices((latest) => {
          saveCachedDevices(latest);
          return latest;
        });
      } else {
        throw new Error("Command request rejected by Tuya API");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to control switch: ${err.message}`, "error");
      setConnectionError(err.message || "Failed to control switch");
      // Revert state
      setDevices(originalDevices);
    } finally {
      // Remove lock
      setTogglingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Control generic device command (e.g. enum speed, integer, etc.)
  const handleSendCommand = async (
    deviceId: string,
    code: string,
    value: string | number | boolean,
  ) => {
    const key = `${deviceId}:${code}`;
    if (togglingKeys.has(key)) return;

    // Set toggle lock
    setTogglingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    // Optimistically update state in UI
    const originalDevices = [...devices];
    setDevices((prevDevices) =>
      prevDevices.map((d) => {
        if (d.id === deviceId) {
          return {
            ...d,
            status: d.status.map((s) => {
              if (s.code === code) {
                return { ...s, value };
              }
              return s;
            }),
          };
        }
        return d;
      }),
    );

    try {
      const success = await sendDeviceCommand(config!, deviceId, code, value);
      if (success) {
        // Update local storage cache
        setDevices((latest) => {
          saveCachedDevices(latest);
          return latest;
        });
      } else {
        throw new Error("Command request rejected by Tuya API");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to send command: ${err.message}`, "error");
      setConnectionError(err.message || "Failed to send command");
      // Revert state
      setDevices(originalDevices);
    } finally {
      // Remove lock
      setTogglingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Map active switches with details from cached devices
  const dashboardTiles = useMemo(() => {
    return activeSwitches
      .map((active) => {
        const device = devices.find((d) => d.id === active.deviceId);
        if (!device) return null;
        const statusItem = device.status.find((s) => s.code === active.code);
        const key = `${active.deviceId}:${active.code}`;
        const renamedName = renamedSwitches[key];
        const defaultName = statusItem?.name || active.code;

        return {
          deviceId: active.deviceId,
          code: active.code,
          device,
          statusItem,
          name: renamedName || defaultName,
          value: !!statusItem?.value,
          online: device.online,
          category: device.category,
        };
      })
      .filter(Boolean);
  }, [activeSwitches, devices, renamedSwitches]);

  // Map all switchable endpoints from cached devices for adding
  const availableSwitchableEndpoints = useMemo(() => {
    const list: {
      device: Device;
      statusItem: any;
      key: string;
      isAdded: boolean;
    }[] = [];
    devices.forEach((device) => {
      device.status.forEach((statusItem) => {
        if (
          isSwitchableCommand(device.category, statusItem.code, statusItem.type)
        ) {
          const key = `${device.id}:${statusItem.code}`;
          const isAdded = activeSwitches.some(
            (a) => a.deviceId === device.id && a.code === statusItem.code,
          );
          list.push({
            device,
            statusItem,
            key,
            isAdded,
          });
        }
      });
    });

    // Filter by search query
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.device.name.toLowerCase().includes(query) ||
        (item.statusItem.name || "").toLowerCase().includes(query) ||
        item.device.category.toLowerCase().includes(query),
    );
  }, [devices, activeSwitches, searchQuery]);

  return (
    <div className="app-container">
      {/* Toast Alert System */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === "error" ? "toast-error" : "toast-success"}`}
          >
            <span>{t.text}</span>
            <button
              className="btn-ghost"
              style={{ padding: 2 }}
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
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
          {config && (
            <>
              <button
                className="btn btn-secondary btn-icon-only"
                onClick={() => handleSyncDevices()}
                disabled={isLoading}
                title="Sync devices"
              >
                <RefreshCw size={18} className={isLoading ? "spinning" : ""} />
              </button>
            </>
          )}
          <button
            className="btn btn-secondary btn-icon-only"
            onClick={() => {
              setSettingsTab("discovered");
              setIsSettingsOpen(true);
            }}
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {!config ? (
          /* Welcome Form (First run) */
          <div className="welcome-container">
            <div className="welcome-logo-large">
              <Sparkles size={40} />
            </div>
            <h2 className="welcome-title">Connect Tuya Cloud</h2>
            <p className="welcome-desc">
              Please enter your Tuya Open Platform credentials to discover and
              control smart switches on your local dashboard.
            </p>

            <form
              onSubmit={handleSaveConfig}
              style={{ width: "100%", textAlign: "left" }}
            >
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
                <label className="form-label">
                  Access Secret (Client Secret)
                </label>
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
                  {REGION_OPTIONS.map((opt) => (
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
                Secure Connection: API keys are stored base64 encrypted in
                localStorage.
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
        ) : (
          /* Dashboard Home */
          <>
            {dashboardTiles.length === 0 ? (
              <div className="empty-dashboard">
                <div className="empty-dashboard-icon">
                  <Lightbulb size={64} strokeWidth={1} />
                </div>
                <h2 className="empty-dashboard-title">
                  Your Dashboard is Empty
                </h2>
                <p className="empty-dashboard-desc">
                  You have connected your Tuya account successfully! Now add
                  switch tiles to configure your spotlight control.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAddSwitchOpen(true)}
                >
                  <Plus size={16} />
                  <span>Add First Switch</span>
                </button>
              </div>
            ) : (
              <div className="dashboard-grid" ref={tilesContainerRef}>
                {dashboardTiles.map((tile: any) => {
                  const key = `${tile.deviceId}:${tile.code}`;
                  return (
                    <DashboardTile
                      key={key}
                      tile={tile}
                      isEditMode={isEditMode}
                      isToggling={togglingKeys.has(key)}
                      onToggle={() =>
                        handleToggleSwitch(tile.deviceId, tile.code, tile.value)
                      }
                      onRemove={(e) =>
                        handleRemoveSwitch(tile.deviceId, tile.code, e)
                      }
                      onSendCommand={(code, val) =>
                        handleSendCommand(tile.deviceId, code, val)
                      }
                      onRename={(newName) =>
                        handleRenameSwitch(tile.deviceId, tile.code, newName)
                      }
                      draggable={isEditMode && tile.online}
                      onDragStart={() => handleDragStart(key)}
                      onDragOver={(e) => handleDragOver(e, key)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(key)}
                      onDragEnd={() => {
                        setDraggedKey(null);
                        setDragOverKey(null);
                      }}
                      isDragging={draggedKey === key}
                      dragOverSide={getDragOverSide(key)}
                    />
                  );
                })}

                {/* Add Switch grid tile shortcut */}
                {isEditMode && (
                  <div
                    className="add-tile"
                    onClick={() => setIsAddSwitchOpen(true)}
                  >
                    <div className="add-tile-icon-circle">
                      <Plus size={20} />
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                      Add switch grid tile
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawer: Add switches */}
      {isAddSwitchOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsAddSwitchOpen(false)}
        >
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Plus size={20} className="text-indigo-400" />
                <span>Add Switches</span>
              </h2>
              <button
                className="btn-ghost btn-icon-only"
                onClick={() => setIsAddSwitchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group" style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search switches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 13,
                    color: "var(--text-muted)",
                  }}
                />
              </div>

              <div className="device-select-list">
                {availableSwitchableEndpoints.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: "40px 0",
                    }}
                  >
                    <HelpCircle
                      size={32}
                      style={{ opacity: 0.3, marginBottom: 8 }}
                    />
                    <p style={{ fontSize: "0.9rem" }}>
                      No switchable devices found.
                    </p>
                    <p style={{ fontSize: "0.75rem", marginTop: 4 }}>
                      Try force syncing in the settings drawer.
                    </p>
                  </div>
                ) : (
                  availableSwitchableEndpoints.map((item) => (
                    <div key={item.key} className="device-select-item">
                      <div className="device-select-info">
                        <div
                          style={{
                            color: item.isAdded
                              ? "var(--accent-primary)"
                              : "var(--text-muted)",
                          }}
                        >
                          <Lightbulb size={20} />
                        </div>
                        <div className="device-select-details">
                          <h4 className="device-select-name">
                            {item.statusItem.name || item.statusItem.code}
                          </h4>
                          <p className="device-select-sub">
                            {item.device.name} ({item.device.category})
                          </p>
                        </div>
                      </div>
                      <div className="device-select-action">
                        {item.isAdded ? (
                          <button
                            className="btn btn-danger btn-icon-only"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "6px",
                            }}
                            onClick={() =>
                              handleRemoveSwitch(
                                item.device.id,
                                item.statusItem.code,
                              )
                            }
                            title="Remove Tile"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-icon-only"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "6px",
                            }}
                            onClick={() =>
                              handleAddSwitch(
                                item.device.id,
                                item.statusItem.code,
                              )
                            }
                            title="Add Tile"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddSwitchOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Settings & Configurations */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Settings size={20} className="text-indigo-400" />
                <span>Dashboard Control</span>
              </h2>
              <button
                className="btn-ghost btn-icon-only"
                onClick={() => setIsSettingsOpen(false)}
              >
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
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsAddSwitchOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    <span>Add Switch Tiles</span>
                  </button>
                </div>
              )}

              {settingsTab === "credentials" ? (
                /* Credentials Form inside Settings drawer */
                <form onSubmit={handleSaveConfig} style={{ textAlign: "left" }}>
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
                      {REGION_OPTIONS.map((opt) => (
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
                        onClick={() => handleSyncDevices()}
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
                        onClick={handleDisconnect}
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
                onClick={() => setIsSettingsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Connection Retry */}
      {connectionError && (
        <div className="modal-overlay" onClick={() => setConnectionError(null)}>
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
                onClick={() => setConnectionError(null)}
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
                {connectionError}
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
                onClick={() => {
                  setConnectionError(null);
                  handleSyncDevices();
                }}
              >
                Retry Connection
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setConnectionError(null);
                  setSettingsTab("credentials");
                  setIsSettingsOpen(true);
                }}
              >
                Edit Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
