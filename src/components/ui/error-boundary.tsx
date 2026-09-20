"use client";

import { useEffect, useState, Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw, ExternalLink } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  canvasName?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.canvasName ? ` ${this.props.canvasName}` : ""}]`, error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full items-center justify-center bg-space-950/50 rounded-xl border border-space-crimson/30 p-6">
          <div className="text-center max-w-md space-y-4">
            <AlertTriangle className="h-12 w-12 text-space-crimson mx-auto" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-white">
              {this.props.canvasName ? `${this.props.canvasName} failed to load` : "Something went wrong"}
            </h3>
            <p className="text-sm text-slate-400">
              {this.state.error?.message || "An unexpected error occurred. The 3D visualization could not be initialized."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/20 px-4 py-2 text-sm font-medium text-space-cyan hover:bg-space-cyan/30 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                aria-label="Retry loading the visualization"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
              <a
                href={`/library/${this.props.canvasName?.toLowerCase().replace(/\s+/g, "-") || "troubleshooting"}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Learn More
              </a>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left mt-4 p-3 bg-space-950 rounded border border-white/10">
                <summary className="text-xs text-slate-500 cursor-pointer">Error details (development)</summary>
                <pre className="mt-2 text-[10px] text-slate-400 overflow-auto max-h-40">{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function CanvasErrorBoundary({ children, canvasName }: { children: ReactNode; canvasName: string }) {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <ErrorBoundary
      canvasName={canvasName}
      onError={() => setTimeout(() => setRetryKey((k) => k + 1), 100)}
      key={retryKey}
    >
      {children}
    </ErrorBoundary>
  );
}