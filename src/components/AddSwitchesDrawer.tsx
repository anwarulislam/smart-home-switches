import React from "react";
import { Plus, X, Search, HelpCircle, Lightbulb, Trash2 } from "lucide-react";
import type { Device } from "../tuyaApi";

interface AddSwitchesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  availableSwitchableEndpoints: {
    device: Device;
    statusItem: any;
    key: string;
    isAdded: boolean;
  }[];
  onAddSwitch: (deviceId: string, code: string) => void;
  onRemoveSwitch: (deviceId: string, code: string) => void;
}

export const AddSwitchesDrawer: React.FC<AddSwitchesDrawerProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  availableSwitchableEndpoints,
  onAddSwitch,
  onRemoveSwitch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Plus size={20} className="text-indigo-400" />
            <span>Add Switches</span>
          </h2>
          <button className="btn-ghost btn-icon-only" onClick={onClose} aria-label="Close drawer">
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
                <HelpCircle size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: "0.9rem" }}>No switchable devices found.</p>
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
                        onClick={() => onRemoveSwitch(item.device.id, item.statusItem.code)}
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
                        onClick={() => onAddSwitch(item.device.id, item.statusItem.code)}
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
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
