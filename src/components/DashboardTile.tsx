import React from "react";
import { Lightbulb, Power, Trash2, Loader2, Fan, Edit2 } from "lucide-react";
import type { Device, FunctionItem } from "../tuyaApi";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const handleSpeedClick = (e: React.MouseEvent, speedVal: string) => {
    e.stopPropagation(); // Avoid toggling the main power state
    if (tile.online && speedStatus) {
      onSendCommand(speedStatus.code, speedVal);
    }
  };

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
    
    if (valStr.includes("1")) return "3s";
    if (valStr.includes("2")) return "2s";
    if (valStr.includes("3")) return "1.3s";
    if (valStr.includes("4")) return "0.8s";
    if (valStr.includes("5")) return "0.4s";
    
    if (valStr === "low") return "3s";
    if (valStr === "middle" || valStr === "mid") return "1.5s";
    if (valStr === "high") return "0.5s";

    return "2s";
  };

  return (
    <div
      data-key={`${tile.deviceId}:${tile.code}`}
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
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:bg-card/80 hover:shadow-md",
        tile.value && tile.online && "border-primary/40 shadow-lg shadow-primary/5",
        !tile.online && "opacity-60",
        isDragging && "opacity-40 scale-95 border-dashed border-primary",
        dragOverSide === "left" && "border-l-4 border-l-primary",
        dragOverSide === "right" && "border-r-4 border-r-primary"
      )}
    >
      {/* Visual Accent Top Line on Hover or Switch Active */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-cyan-500 transition-opacity duration-300",
          tile.value && tile.online ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        )}
      />

      <div className="flex justify-between items-start mb-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
            tile.value && tile.online
              ? "bg-primary/15 text-primary shadow-sm"
              : "bg-muted-foreground/5 text-muted-foreground"
          )}
        >
          {isFan ? (
            <Fan
              size={20}
              className={tile.value && tile.online ? "spinning-fan" : ""}
              style={{
                "--fan-speed-duration": getFanSpeedDuration(),
              } as React.CSSProperties}
            />
          ) : tile.value && tile.online ? (
            <Lightbulb size={20} />
          ) : (
            <Power size={20} />
          )}
        </div>
        {isEditMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
            onClick={onRemove}
            title="Remove from Dashboard"
          >
            <Trash2 size={15} />
          </Button>
        )}
      </div>

      <div className="mb-5 flex-1 min-w-0">
        {isEditing && isEditMode ? (
          <input
            type="text"
            className="w-full bg-muted border border-border rounded-md px-2 py-1 text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
            <h3
              className={cn(
                "text-base font-semibold text-foreground truncate select-none",
                isEditMode && "cursor-text hover:text-primary transition-colors"
              )}
              onDoubleClick={() => isEditMode && setIsEditing(true)}
            >
              {tile.name}
            </h3>
            {isEditMode && (
              <button
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/50 hover:text-primary transition-all cursor-pointer"
                onClick={() => setIsEditing(true)}
                title="Rename switch"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground/75 font-semibold tracking-wide flex items-center gap-1.5 uppercase mt-1 truncate">
          <span>{tile.category}</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="truncate">{tile.device.name}</span>
        </div>
      </div>

      {/* Fan Speed Controls Section */}
      {speedStatus && (
        <div className="mt-2 mb-4 flex flex-col gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
          <div className="text-[10px] text-muted-foreground/70 font-bold tracking-wider uppercase">
            Speed: {formatSpeedLabel(String(speedStatus.value))}
          </div>
          <div className="flex bg-muted/50 border border-border/30 rounded-lg p-0.5">
            {speedRange.map((speedVal) => (
              <button
                key={speedVal}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground rounded-md transition-all text-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
                  speedStatus.value === speedVal && "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:text-primary-foreground"
                )}
                disabled={!tile.online || !tile.value}
                onClick={(e) => handleSpeedClick(e, speedVal)}
              >
                {formatSpeedLabel(speedVal)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn("flex justify-between items-center", speedStatus ? "mt-1" : "mt-0")}>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors",
            tile.online
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              tile.online ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"
            )}
          />
          <span>{tile.online ? "Online" : "Offline"}</span>
        </span>

        {isToggling ? (
          <Loader2
            size={18}
            className="animate-spin text-primary mr-3"
          />
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={tile.value}
              disabled={!tile.online}
              onCheckedChange={onToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};
