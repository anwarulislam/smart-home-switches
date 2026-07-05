import React from "react";
import { Lightbulb, Power, Trash2, Loader2, Fan, Edit2 } from "lucide-react";
import type { Device, FunctionItem } from "../tuyaApi";

interface DashboardTileProps {
  tile: {
    deviceId: string;
    code: string;
    device: Device;
    statusItem?: FunctionItem;
    name: string;
    value: boolean;
    online: boolean;
    category: string;
  };
  isEditMode: boolean;
  isToggling: boolean;
  onToggle: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onSendCommand: (code: string, value: string | number | boolean) => Promise<void>;
  onRename: (newName: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  dragOverSide?: "left" | "right" | null;
}

export const DashboardTile: React.FC<DashboardTileProps> = ({
  tile,
  isEditMode,
  isToggling,
  onToggle,
  onRemove,
  onSendCommand,
  onRename,
  draggable,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  dragOverSide,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempName, setTempName] = React.useState(tile.name);

  React.useEffect(() => {
    setTempName(tile.name);
  }, [tile.name]);

  const handleSaveName = () => {
    setIsEditing(false);
    onRename(tempName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempName(tile.name);
    }
  };

  const activeClass = tile.value ? "active" : "";
  const offlineClass = !tile.online ? "offline" : "";

  // Identify if this is a fan switch
  const isFan =
    tile.code.toLowerCase().includes("fan") ||
    tile.category.toLowerCase().includes("fan") ||
    tile.device.name.toLowerCase().includes("fan");

  // Search if the device has a matching enum status control
  const speedStatus = tile.device.status.find((s) => {
    if (s.type !== "Enum") return false;
    const switchBase = tile.code.replace(/^switch_?/, "").toLowerCase();
    const statusLower = s.code.toLowerCase();
    
    // Match control terms for speed, level, gear, or mode
    const isControlWord =
      statusLower.includes("speed") ||
      statusLower.includes("level") ||
      statusLower.includes("gear") ||
      statusLower.includes("mode");

    if (switchBase) {
      return isControlWord && statusLower.includes(switchBase);
    }
    return isControlWord;
  });

  // Get allowed speed ranges dynamically from functions schema
  const getSpeedRange = (): string[] => {
    if (speedStatus?.values) {
      try {
        const parsed = JSON.parse(speedStatus.values);
        if (Array.isArray(parsed.range)) {
          return parsed.range;
        }
      } catch {}
    }
    // Return only the current value as a fallback if functions are not yet loaded/cached
    return speedStatus?.value ? [String(speedStatus.value)] : [];
  };

  const speedRange = getSpeedRange();

  // Helper to format labels
  const formatSpeedLabel = (val: string): string => {
    const clean = val.replace(/^level_/, "");
    if (clean.toLowerCase() === "middle") return "Mid";
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Determine fan animation speed duration
  const getFanSpeedDuration = (): string => {
    if (!speedStatus?.value) return "2s";
    const valStr = String(speedStatus.value).toLowerCase();
    
    // Map level_1 to level_5 to durations
    if (valStr.includes("1")) return "3s";
    if (valStr.includes("2")) return "2s";
    if (valStr.includes("3")) return "1.3s";
    if (valStr.includes("4")) return "0.8s";
    if (valStr.includes("5")) return "0.4s";
    
    // Low/Mid/High mapping
    if (valStr === "low") return "3s";
    if (valStr === "middle" || valStr === "mid") return "1.5s";
    if (valStr === "high") return "0.5s";

    return "2s";
  };

  const handleSpeedClick = (e: React.MouseEvent, speedVal: string) => {
    e.stopPropagation(); // Avoid toggling the main power state
    if (tile.online && speedStatus) {
      onSendCommand(speedStatus.code, speedVal);
    }
  };

  const draggingClass = isDragging ? "dragging" : "";
  const dragOverClass = dragOverSide ? `drag-over-${dragOverSide}` : "";

  return (
    <div
      data-key={`${tile.deviceId}:${tile.code}`}
      className={`tile ${activeClass} ${offlineClass} ${draggingClass} ${dragOverClass}`}
      onClick={() => !isEditMode && tile.online && onToggle()}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        cursor: isEditMode ? "grab" : tile.online ? "pointer" : "not-allowed",
        minHeight: speedStatus ? "210px" : "160px",
      }}
    >
      <div className="tile-top">
        <div className="tile-icon-wrapper">
          {isFan ? (
            <Fan
              size={20}
              className={tile.value && tile.online ? "spinning-fan" : ""}
              style={{
                "--fan-speed-duration": getFanSpeedDuration(),
              } as React.CSSProperties}
            />
          ) : tile.value ? (
            <Lightbulb size={20} />
          ) : (
            <Power size={20} />
          )}
        </div>
        {isEditMode && (
          <button
            className="tile-menu-btn"
            onClick={onRemove}
            title="Remove from Dashboard"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="tile-info">
        {isEditing && isEditMode ? (
          <input
            type="text"
            className="tile-name-input"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="tile-name-row" onClick={(e) => e.stopPropagation()}>
            <h3
              className="tile-name"
              onDoubleClick={() => isEditMode && setIsEditing(true)}
              style={{ cursor: isEditMode ? "text" : "inherit" }}
            >
              {tile.name}
            </h3>
            {isEditMode && (
              <button
                className="tile-rename-btn"
                onClick={() => setIsEditing(true)}
                title="Rename switch"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
        <div className="tile-category">
          <span>{tile.category}</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>•</span>
          <span>{tile.device.name}</span>
        </div>
      </div>

      {/* Fan Speed Controls Section */}
      {speedStatus && (
        <div className="fan-speed-container">
          <div className="fan-speed-label">
            Speed: {formatSpeedLabel(String(speedStatus.value))}
          </div>
          <div className="fan-speed-buttons">
            {speedRange.map((speedVal) => (
              <button
                key={speedVal}
                className={`fan-speed-btn ${
                  speedStatus.value === speedVal ? "active" : ""
                }`}
                disabled={!tile.online || !tile.value} // Disable if offline or fan is turned off
                onClick={(e) => handleSpeedClick(e, speedVal)}
              >
                {formatSpeedLabel(speedVal)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tile-bottom" style={{ marginTop: speedStatus ? "12px" : "0px" }}>
        <span
          className={`status-badge ${
            tile.online ? "status-online" : "status-offline"
          }`}
        >
          {tile.online ? (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-success)",
                }}
              />
              <span>Online</span>
            </>
          ) : (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-error)",
                }}
              />
              <span>Offline</span>
            </>
          )}
        </span>

        {isToggling ? (
          <Loader2
            size={20}
            className="spinning text-indigo-400"
            style={{ marginRight: 16 }}
          />
        ) : (
          <label
            className="switch-control"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={tile.value}
              disabled={!tile.online}
              onChange={onToggle}
            />
            <span className="switch-slider" />
          </label>
        )}
      </div>
    </div>
  );
};
