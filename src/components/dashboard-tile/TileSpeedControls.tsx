import React from "react";
import { cn } from "@/lib/utils";

interface TileSpeedControlsProps {
  online: boolean;
  value: boolean;
  speedStatusValue: string | number;
  speedRange: string[];
  onSpeedClick: (e: React.MouseEvent, speedVal: string) => void;
  formatSpeedLabel: (val: string) => string;
}

export const TileSpeedControls: React.FC<TileSpeedControlsProps> = ({
  online,
  value,
  speedStatusValue,
  speedRange,
  onSpeedClick,
  formatSpeedLabel,
}) => {
  return (
    <div
      className="mt-2 mb-1 flex flex-col gap-1.5 w-full relative z-20"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-[10px] text-muted-foreground/80 dark:text-muted-foreground/90 font-extrabold tracking-wider uppercase flex justify-between items-center px-0.5 select-none">
        <span>Fan Speed</span>
        <span className="text-primary font-bold text-[10px]">
          {value ? formatSpeedLabel(String(speedStatusValue)) : "OFF"}
        </span>
      </div>
      <div className="flex bg-slate-100 dark:bg-slate-900 border border-border/60 rounded-3xl p-1 gap-1">
        {speedRange.map((speedVal) => {
          const isActive = value && speedStatusValue === speedVal;
          return (
            <button
              key={speedVal}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer border border-transparent select-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs border-primary/20"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50",
              )}
              disabled={!online}
              onClick={(e) => onSpeedClick(e, speedVal)}
            >
              {formatSpeedLabel(speedVal)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
