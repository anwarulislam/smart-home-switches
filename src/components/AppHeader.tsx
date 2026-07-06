import React from "react";
import { Settings, RefreshCw, Sparkles, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface AppHeaderProps {
  hasConfig: boolean;
  isLoading: boolean;
  onSync: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  hasConfig,
  isLoading,
  onSync,
  onOpenSettings,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex justify-between items-center pb-4 mb-10 border-b border-border transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white shadow-md shadow-primary/20">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Smart Life
          </h1>
          <p className="text-xs text-muted-foreground -mt-1 font-medium">
            Smart Switch Dashboard
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Toggle */}
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle theme"
          className="cursor-pointer"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </Button>

        {hasConfig && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onSync}
            disabled={isLoading}
            title="Sync devices"
            className="cursor-pointer"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </Button>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={onOpenSettings}
          title="Settings"
          className="cursor-pointer"
        >
          <Settings size={18} />
        </Button>
      </div>
    </header>
  );
};
