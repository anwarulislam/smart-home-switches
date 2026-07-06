import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TileHeaderProps {
  isEditMode: boolean;
  online: boolean;
  onRemove: (e: React.MouseEvent) => void;
}

export const TileHeader: React.FC<TileHeaderProps> = ({
  isEditMode,
  online,
  onRemove,
}) => {
  return (
    <div className="flex justify-end items-center mb-1">
      {isEditMode ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer relative z-20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          title="Remove from Dashboard"
        >
          <Trash2 size={15} />
        </Button>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors select-none",
            online
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              online ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"
            )}
          />
          <span>{online ? "Online" : "Offline"}</span>
        </span>
      )}
    </div>
  );
};
