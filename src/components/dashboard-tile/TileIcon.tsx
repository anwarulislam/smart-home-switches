import React from "react";
import { Fan, Lightbulb, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface TileIconProps {
  value: boolean;
  online: boolean;
  isFan: boolean;
  isLight: boolean;
  fanSpeedDuration: string;
}

export const TileIcon: React.FC<TileIconProps> = ({
  value,
  online,
  isFan,
  isLight,
  fanSpeedDuration,
}) => {
  const isActive = value && online;

  return (
    <div
      className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 relative mb-3",
        isActive
          ? isLight
            ? "bg-amber-500/10 text-amber-500 shadow-md shadow-amber-500/10 ring-4 ring-amber-500/5"
            : isFan
            ? "bg-cyan-500/10 text-cyan-500 shadow-md shadow-cyan-500/10 ring-4 ring-cyan-500/5"
            : "bg-primary/10 text-primary shadow-md shadow-primary/10 ring-4 ring-primary/5"
          : "bg-muted-foreground/5 text-muted-foreground/40"
      )}
    >
      {/* Radial light aura behind the icon when active */}
      {isActive && (
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-md opacity-30 animate-pulse",
            isLight ? "bg-amber-400" : isFan ? "bg-cyan-400" : "bg-primary"
          )}
        />
      )}
      
      {isFan ? (
        <Fan
          size={36}
          className={cn("relative z-10 transition-all duration-300", isActive ? "spinning-fan" : "")}
          style={{
            "--fan-speed-duration": fanSpeedDuration,
          } as React.CSSProperties}
        />
      ) : isLight ? (
        <Lightbulb
          size={36}
          className="relative z-10 transition-all duration-300"
          strokeWidth={isActive ? 2.5 : 1.5}
        />
      ) : (
        <Power
          size={36}
          className="relative z-10 transition-all duration-300"
          strokeWidth={isActive ? 2.5 : 1.5}
        />
      )}
    </div>
  );
};
