import React from "react";
import { WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectionErrorModalProps {
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onEditSettings: () => void;
}

export const ConnectionErrorModal: React.FC<ConnectionErrorModalProps> = ({
  error,
  onClose,
  onRetry,
  onEditSettings,
}) => {
  if (!error) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-popover border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <WifiOff size={20} />
            <span>Connection Failed</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
            aria-label="Close error dialog"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="p-6 text-center">
          <p className="text-sm font-semibold text-foreground mb-3">
            An error occurred while connecting to Tuya Cloud:
          </p>
          <div className="bg-destructive/5 border border-dashed border-destructive/20 text-destructive text-xs font-mono p-4 rounded-lg break-all mb-5 select-all text-left">
            {error}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Would you like to retry using your saved credentials, or edit them in settings?
          </p>
        </div>

        <div className="p-5 border-t border-border flex justify-center gap-3 bg-muted/10">
          <Button
            variant="default"
            className="px-5 shadow-xs cursor-pointer"
            onClick={onRetry}
          >
            Retry Connection
          </Button>
          <Button
            variant="secondary"
            className="px-5 cursor-pointer"
            onClick={onEditSettings}
          >
            Edit Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
