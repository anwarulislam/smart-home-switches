import React from "react";
import { X } from "lucide-react";
import type { Toast } from "../hooks/useToast";

interface ToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type === "error" ? "toast-error" : "toast-success"}`}
        >
          <span>{t.text}</span>
          <button
            className="btn-ghost"
            style={{ padding: 2 }}
            onClick={() => onRemoveToast(t.id)}
            aria-label="Close toast"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
