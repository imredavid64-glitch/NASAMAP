"use client";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-white/5 rounded";
  const variantStyles = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => {
          const isLastLine = i === lines - 1;
          let lineWidth = width;
          if (isLastLine && width) {
            if (typeof width === "number") {
              lineWidth = `${width * 0.6}px`;
            } else if (width.endsWith("px")) {
              const numWidth = parseFloat(width);
              lineWidth = `${numWidth * 0.6}px`;
            } else if (width.endsWith("%")) {
              const numWidth = parseFloat(width);
              lineWidth = `${numWidth * 0.6}%`;
            } else {
              lineWidth = `${width} 0.6`;
            }
          }
          return (
            <div
              key={i}
              className={cn(baseStyles, variantStyles[variant])}
              style={{
                width: lineWidth,
                height,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-panel p-6 animate-pulse space-y-4" aria-hidden="true">
      <Skeleton variant="text" width="40%" height="24px" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} height="16px" />
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass-panel p-4 animate-pulse space-y-2" aria-hidden="true">
      <Skeleton variant="text" width="50%" height="12px" />
      <Skeleton variant="text" width="80%" height="28px" />
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-panel p-4 animate-pulse" aria-hidden="true">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={`header-${i}`} variant="text" width="80%" height="14px" />
        ))}
        <div className="space-y-3 border-t border-white/10 pt-4">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }, (_, col) => (
                <Skeleton key={`${row}-${col}`} variant="text" width="90%" height="16px" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 4, hasIcon = true }: { items?: number; hasIcon?: boolean }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          {hasIcon && <Skeleton variant="circular" width="16px" height="16px" />}
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width="70%" height="16px" />
            <Skeleton variant="text" width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ items = 6, cols = 3 }: { items?: number; cols?: number }) {
  return (
    <div className="grid gap-4 animate-pulse" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: items }, (_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  );
}

export function PagePlaceholderSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 animate-pulse space-y-8" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" height="32px" />
        <Skeleton variant="text" width="60%" height="20px" />
      </div>
      <GridSkeleton items={4} cols={2} />
    </div>
  );
}