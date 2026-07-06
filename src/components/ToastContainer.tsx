import React from "react";
import { X } from "lucide-react";
import type { Toast } from "../hooks/useToast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-4 px-5 py-4 rounded-xl border bg-card/95 backdrop-blur-md shadow-lg min-w-[280px] max-w-[400px] text-sm text-foreground animate-slide-up",
            t.type === "error"
              ? "border-l-4 border-l-destructive border-border"
              : "border-l-4 border-l-emerald-500 border-border"
          )}
        >
          <span className="font-medium">{t.text}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={() => onRemoveToast(t.id)}
            aria-label="Close toast"
          >
            <X size={14} />
          </Button>
        </div>
      ))}
    </div>
  );
};
