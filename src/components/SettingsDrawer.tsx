import React from "react";
import { Settings, X, Plus, Loader2, RefreshCw, Database, Download } from "lucide-react";
import type { Device } from "../tuyaApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-popover border-l border-border shadow-2xl h-full flex flex-col animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Settings size={20} className="text-primary" />
            <span>Dashboard Control</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="flex border-b border-border bg-muted/20">
          <button
            className={cn(
              "flex-1 text-center py-3.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 hover:bg-muted/10",
              settingsTab === "discovered"
                ? "text-primary border-primary bg-primary/5 font-bold"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
            onClick={() => setSettingsTab("discovered")}
          >
            Specs ({devices.length})
          </button>
          <button
            className={cn(
              "flex-1 text-center py-3.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 hover:bg-muted/10",
              settingsTab === "credentials"
                ? "text-primary border-primary bg-primary/5 font-bold"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
            onClick={() => setSettingsTab("credentials")}
          >
            Connection
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* PWA Installation Section */}
          {(isInstallable || isInstalled) && (
            <div className="space-y-3 pb-5 border-b border-border/60">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  App Installation
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                    isInstalled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-primary/10 text-primary dark:text-primary-400"
                  )}
                >
                  {isInstalled ? "Installed" : "Installable"}
                </span>
              </div>
              {isInstallable && onInstallApp && (
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-cyan-500 to-primary text-white font-medium hover:brightness-110 cursor-pointer shadow-sm"
                  onClick={onInstallApp}
                >
                  <Download size={16} />
                  <span>Install Smart Life App</span>
                </Button>
              )}
            </div>
          )}

          {/* Dashboard Controls (Edit Mode & Add Switch) */}
          {config && (
            <div className="space-y-4 pb-5 border-b border-border/60">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Edit Mode (Rename & Reorder)
                </span>
                <Switch
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                />
              </div>
              <Button
                type="button"
                className="w-full cursor-pointer shadow-sm"
                onClick={onOpenAddSwitches}
              >
                <Plus size={16} />
                <span>Add Switch Tiles</span>
              </Button>
            </div>
          )}

          {settingsTab === "credentials" ? (
            /* Credentials Form inside Settings drawer */
            <form onSubmit={onSaveConfig} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Access ID
                </label>
                <Input
                  type="text"
                  value={formAccessId}
                  onChange={(e) => setFormAccessId(e.target.value)}
                  placeholder="Enter Access ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Access Secret
                </label>
                <Input
                  type="password"
                  value={formAccessSecret}
                  onChange={(e) => setFormAccessSecret(e.target.value)}
                  placeholder="Enter Access Secret"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Region Endpoint
                </label>
                <Select
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                >
                  {regionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              {testStatus === "error" && (
                <div className="text-destructive text-sm font-medium">
                  ❌ {testErrorMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={testStatus === "testing"}
                >
                  {testStatus === "testing" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Testing & Saving...</span>
                    </>
                  ) : (
                    <span>Verify & Update Credentials</span>
                  )}
                </Button>

                {config && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={onSyncDevices}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      size={16}
                      className={isLoading ? "animate-spin" : ""}
                    />
                    <span>Force Re-sync Devices</span>
                  </Button>
                )}

                {config && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full mt-4 cursor-pointer"
                    onClick={onDisconnect}
                  >
                    <span>Disconnect Tuya Account</span>
                  </Button>
                )}
              </div>
            </form>
          ) : (
            /* Hardware Details Tab */
            <div className="space-y-4">
              {devices.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                  <Database size={36} className="opacity-30 mb-2" />
                  <p className="text-sm font-medium">No discovered devices found.</p>
                </div>
              ) : (
                devices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-foreground truncate max-w-[70%]">
                        {dev.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                        {dev.category}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Device ID</span>
                        <span className="font-mono text-[11px] text-foreground/80 select-all">
                          {dev.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={cn(
                            "font-semibold",
                            dev.online
                              ? "text-emerald-500"
                              : "text-rose-500"
                          )}
                        >
                          {dev.online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product</span>
                        <span className="text-foreground/85 truncate max-w-[65%]">
                          {dev.product_name}
                        </span>
                      </div>

                      {/* Display device functions/status codes */}
                      {dev.status && dev.status.length > 0 && (
                        <div className="pt-2 border-t border-border/50 mt-2 space-y-1">
                          <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Functions & Status Codes
                          </p>
                          {dev.status.map((stat) => (
                            <div
                              key={stat.code}
                              className="flex justify-between items-center text-[11px] pl-2 border-l border-border"
                            >
                              <span className="text-muted-foreground/90 truncate max-w-[60%]">
                                {stat.name || stat.code}{" "}
                                <span className="text-[9px] text-muted-foreground/50">
                                  ({stat.code})
                                </span>
                              </span>
                              <span className="font-mono font-semibold text-foreground/85">
                                {String(stat.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex justify-end bg-muted/10">
          <Button variant="outline" className="px-6 cursor-pointer" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
