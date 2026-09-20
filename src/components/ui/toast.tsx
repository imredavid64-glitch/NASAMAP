"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastType = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toastWithId: Toast = { ...newToast, id };
    setToasts((prev) => [...prev, toastWithId]);

    if (newToast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration ?? 5000);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration === 0) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    loading: Loader2,
  };

  const colors = {
    success: "border-space-emerald/40 bg-space-emerald/10 text-space-emerald",
    error: "border-space-crimson/40 bg-space-crimson/10 text-space-crimson",
    info: "border-space-cyan/40 bg-space-cyan/10 text-space-cyan",
    loading: "border-space-amber/40 bg-space-amber/10 text-space-amber",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur transition-all duration-200",
        colors[toast.type],
        isExiting && "opacity-0 translate-x-full"
      )}
      role="alert"
      aria-live="assertive"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        {toast.description && <p className="mt-1 text-sm text-slate-300">{toast.description}</p>}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-space-cyan"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 200);
        }}
        className="shrink-0 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function successToast(title: string, description?: string, options?: { duration?: number; action?: Toast["action"] }) {
  return { type: "success" as const, title, description, ...options };
}

export function errorToast(title: string, description?: string, options?: { duration?: number; action?: Toast["action"] }) {
  return { type: "error" as const, title, description, ...options };
}

export function infoToast(title: string, description?: string, options?: { duration?: number; action?: Toast["action"] }) {
  return { type: "info" as const, title, description, ...options };
}

export function loadingToast(title: string, description?: string) {
  return { type: "loading" as const, title, description, duration: 0 };
}