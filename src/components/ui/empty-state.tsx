"use client";

import { cn } from "@/lib/cn";
import { WifiOff, Database, Search, AlertCircle, Star, Compass, Loader2 } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4 space-y-4",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
        {icon || <Search className="h-8 w-8" />}
      </div>
      <div className="max-w-sm space-y-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950",
            action.variant === "primary"
              ? "bg-space-cyan text-space-950 hover:bg-space-cyan/80"
              : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function OfflineState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<WifiOff className="h-8 w-8" />}
      title="You're offline"
      description="NASAMAP works offline! Live data will show the last cached snapshot. Check your connection and try again."
      action={onRetry ? { label: "Try again", onClick: onRetry, variant: "primary" } : undefined}
    />
  );
}

export function NoDataState({
  title = "No data available",
  description = "There's nothing to show here yet.",
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateProps["action"];
}) {
  return (
    <EmptyState icon={icon} title={title} description={description} action={action} />
  );
}

export function LoadingState({
  message = "Loading…",
  showSpinner = true,
}: {
  message?: string;
  showSpinner?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-3 text-center" role="status" aria-live="polite">
      {showSpinner && (
        <Loader2 className="h-8 w-8 text-space-cyan animate-spin" aria-hidden="true" />
      )}
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-8 w-8 text-space-crimson" />}
      title={title}
      description={description}
      action={onRetry ? { label: "Try again", onClick: onRetry, variant: "primary" } : undefined}
    />
  );
}

export function StaleDataBanner({
  lastUpdated,
  onRefresh,
}: {
  lastUpdated: string;
  onRefresh: () => void;
}) {
  return (
    <div
      className="mb-4 flex items-center justify-between rounded-lg border border-space-amber/30 bg-space-amber/10 px-4 py-3 text-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-space-amber">
        <Database className="h-4 w-4" aria-hidden="true" />
        <span>Showing cached data from {lastUpdated}</span>
      </div>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-1.5 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
      >
        <Loader2 className="h-3.5 w-3.5" aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}