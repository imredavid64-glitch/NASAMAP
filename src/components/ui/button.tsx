import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
  "aria-pressed"?: boolean;
}

export function Button({
  variant = "default",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  "aria-pressed": ariaPressed,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "bg-space-cyan text-space-950 hover:bg-space-cyan/90",
    outline: "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10",
    ghost: "bg-transparent text-slate-300 hover:bg-white/10",
    destructive: "bg-space-crimson text-white hover:bg-space-crimson/90",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-pressed={ariaPressed}
      {...props}
    >
      {loading && (
        <>
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="sr-only">Loading</span>
        </>
      )}
      {children}
    </button>
  );
}