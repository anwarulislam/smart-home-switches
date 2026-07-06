import React, { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TileInfoProps {
  isEditMode: boolean;
  name: string;
  category: string;
  deviceName: string;
  onRename: (newName: string) => void;
}

export const TileInfo: React.FC<TileInfoProps> = ({
  isEditMode,
  name,
  category,
  deviceName,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  useEffect(() => {
    setTempName(name);
  }, [name]);

  const handleSaveName = () => {
    setIsEditing(false);
    onRename(tempName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempName(name);
    }
  };

  return (
    <div className="mb-2 text-center w-full min-w-0" onClick={(e) => e.stopPropagation()}>
      {isEditing && isEditMode ? (
        <input
          type="text"
          className="w-full text-center bg-muted border border-border rounded-md px-2 py-1 text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-center gap-1.5 w-full">
          <h3
            className={cn(
              "text-sm sm:text-base font-bold text-foreground truncate select-none max-w-[85%]",
              isEditMode && "cursor-text md:hover:text-primary transition-colors"
            )}
            onDoubleClick={() => isEditMode && setIsEditing(true)}
          >
            {name}
          </h3>
          {isEditMode && (
            <button
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-muted-foreground/50 md:hover:text-primary transition-all cursor-pointer"
              onClick={() => setIsEditing(true)}
              title="Rename switch"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
      )}
      <div className="text-[9px] text-muted-foreground/60 font-semibold tracking-wide flex items-center justify-center gap-1 uppercase mt-0.5 truncate select-none">
        <span>{category}</span>
        <span>•</span>
        <span className="truncate max-w-[70px]">{deviceName}</span>
      </div>
    </div>
  );
};
