import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
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
} from "../tuyaApi";
import type { TuyaConfig, Device } from "../tuyaApi";
import { useToast } from "./useToast";

export const REGION_OPTIONS = [
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

export function useTuyaDashboard() {
  const { toasts, showToast, removeToast } = useToast();

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
  const [formAccessId, setFormAccessId] = useState("");
  const [formAccessSecret, setFormAccessSecret] = useState("");
  const [formRegion, setFormRegion] = useState(REGION_OPTIONS[0].value);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testErrorMessage, setTestErrorMessage] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Toggling lock list (deviceId:code) to prevent double trigger and show load state
  const [togglingKeys, setTogglingKeys] = useState<Set<string>>(new Set());

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return {
    config,
    devices,
    activeSwitches,
    renamedSwitches,
    isLoading,
    isSettingsOpen,
    setIsSettingsOpen,
    isAddSwitchOpen,
    setIsAddSwitchOpen,
    isEditMode,
    setIsEditMode,
    draggedKey,
    dragOverKey,
    settingsTab,
    setSettingsTab,
    tilesContainerRef,
    formAccessId,
    setFormAccessId,
    formAccessSecret,
    setFormAccessSecret,
    formRegion,
    setFormRegion,
    testStatus,
    testErrorMessage,
    connectionError,
    setConnectionError,
    searchQuery,
    setSearchQuery,
    togglingKeys,
    toasts,
    removeToast,
    showToast,
    handleSyncDevices,
    handleSaveConfig,
    handleDisconnect,
    handleRenameSwitch,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getDragOverSide,
    handleAddSwitch,
    handleRemoveSwitch,
    handleToggleSwitch,
    handleSendCommand,
    dashboardTiles,
    availableSwitchableEndpoints,
  };
}
