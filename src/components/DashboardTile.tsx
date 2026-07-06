import React from "react";
import { Loader2 } from "lucide-react";
import type { Device, FunctionItem } from "../tuyaApi";
import { cn } from "@/lib/utils";
import { TileHeader } from "./dashboard-tile/TileHeader";
import { TileIcon } from "./dashboard-tile/TileIcon";
import { TileInfo } from "./dashboard-tile/TileInfo";
import { TileSpeedControls } from "./dashboard-tile/TileSpeedControls";

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
  onToggle: (targetValue: boolean) => void;
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
  const handleSpeedClick = async (e: React.MouseEvent, speedVal: string) => {
    e.stopPropagation();
    if (tile.online && speedStatus) {
      if (!tile.value) {
        // If the fan is OFF, turn it ON first, then set the speed
        await onToggle(true);
      }
      onSendCommand(speedStatus.code, speedVal);
    }
  };

  // Identify if this is a fan switch
  const isFan =
    tile.code.toLowerCase().includes("fan") ||
    tile.category.toLowerCase().includes("fan") ||
    tile.device.name.toLowerCase().includes("fan");

  // Identify if this is a light switch
  const isLight =
    tile.code.toLowerCase().includes("light") ||
    tile.code.toLowerCase().includes("lamp") ||
    tile.code.toLowerCase().includes("bulb") ||
    tile.category.toLowerCase().includes("light") ||
    tile.category.toLowerCase().includes("dj") ||
    tile.device.name.toLowerCase().includes("light") ||
    tile.device.name.toLowerCase().includes("lamp") ||
    tile.device.name.toLowerCase().includes("bulb") ||
    tile.device.name.toLowerCase().includes("spotlight");

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

  // Determine card background styles based on device state
  const getCardBgClass = () => {
    if (!tile.online) return "bg-card/40 border-border/50 opacity-60";
    if (!tile.value) return "bg-card/60 border-border/80 md:hover:border-border md:hover:bg-card/80 md:hover:shadow-md";
    
    if (isLight) {
      return "bg-gradient-to-br from-amber-500/10 via-card/90 to-card/75 border-amber-500/30 shadow-lg shadow-amber-500/4";
    }
    if (isFan) {
      return "bg-gradient-to-br from-cyan-500/10 via-card/90 to-card/75 border-cyan-500/30 shadow-lg shadow-cyan-500/4";
    }
    return "bg-gradient-to-br from-primary/10 via-card/90 to-card/75 border-primary/30 shadow-lg shadow-primary/4";
  };

  return (
    <div
      data-key={`${tile.deviceId}:${tile.code}`}
      onClick={() => !isEditMode && tile.online && onToggle(!tile.value)}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        cursor: isEditMode ? "grab" : tile.online ? "pointer" : "default",
      }}
      className={cn(
        "group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 select-none",
        getCardBgClass(),
        speedStatus ? "min-h-[270px] sm:min-h-[290px]" : "min-h-[210px] sm:min-h-[220px]",
        isDragging && "opacity-40 scale-95 border-dashed border-primary",
        dragOverSide === "left" && "border-l-4 border-l-primary",
        dragOverSide === "right" && "border-r-4 border-r-primary"
      )}
    >
      {/* Visual Accent Top Line on Hover or Switch Active */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300",
          tile.value && tile.online
            ? isLight
              ? "opacity-100 bg-gradient-to-r from-amber-400 to-orange-500"
              : isFan
              ? "opacity-100 bg-gradient-to-r from-cyan-400 to-blue-500"
              : "opacity-100 bg-gradient-to-r from-primary to-cyan-500"
            : "opacity-0 md:group-hover:opacity-60 bg-muted-foreground/30"
        )}
      />

      {/* Loading Overlay */}
      {isToggling && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center rounded-2xl z-30 transition-all">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      )}

      {/* Top Header Row (Online Status Badge / Remove Button) */}
      <TileHeader
        isEditMode={isEditMode}
        online={tile.online}
        onRemove={onRemove}
      />

      {/* Central Visual Control Area */}
      <div className="flex flex-col items-center justify-center py-2 flex-1 w-full">
        <TileIcon
          value={tile.value}
          online={tile.online}
          isFan={isFan}
          isLight={isLight}
          fanSpeedDuration={getFanSpeedDuration()}
        />

        <TileInfo
          isEditMode={isEditMode}
          name={tile.name}
          category={tile.category}
          deviceName={tile.device.name}
          onRename={onRename}
        />

        {/* Large State Status Pill */}
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full select-none border",
            tile.value && tile.online
              ? isLight
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : isFan
                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
                : "bg-primary/10 text-primary border-primary/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent"
          )}
        >
          {tile.online ? (tile.value ? "ON" : "OFF") : "OFFLINE"}
        </span>
      </div>

      {/* Fan Speed Controls Section */}
      {speedStatus && (
        <TileSpeedControls
          online={tile.online}
          value={tile.value}
          speedStatusValue={speedStatus.value}
          speedRange={speedRange}
          onSpeedClick={handleSpeedClick}
          formatSpeedLabel={formatSpeedLabel}
        />
      )}
    </div>
  );
};
