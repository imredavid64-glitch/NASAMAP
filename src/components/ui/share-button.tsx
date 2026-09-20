"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Link2, ExternalLink, Download } from "lucide-react";
import { useToast, successToast } from "@/components/ui/toast";

interface ShareButtonProps {
  url?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ShareButton({
  url = typeof window !== "undefined" ? window.location.href : "",
  text = "",
  children,
  className = "",
  size = "md",
  showLabel = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(successToast("Link copied!", "Mission URL copied to clipboard", { duration: 3000 }));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [url, toast]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "NASAMAP Mission Design",
      text: text || "Check out this mission design on NASAMAP",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast(successToast("Link copied!", "Share dialog not available, copied to clipboard"));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        toast(successToast("Link copied!", "Copied to clipboard"));
      }
    }
  }, [url, text, toast]);

  const sizeClasses = {
    sm: "px-2 py-1.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-1.5",
    lg: "px-4 py-2.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCopy}
        className={`inline-flex items-center ${sizeClasses[size]} rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950 ${className}`}
        aria-label={copied ? "Copied to clipboard" : "Copy mission link"}
      >
        {copied ? (
          <Check className={iconSizes[size]} aria-hidden="true" />
        ) : (
          <Copy className={iconSizes[size]} aria-hidden="true" />
        )}
        {showLabel && (
          <span className="font-mono">
            {copied ? "Copied!" : "Copy Link"}
          </span>
        )}
      </button>

      <button
        onClick={handleShare}
        className={`inline-flex items-center ${sizeClasses[size]} rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950`}
        aria-label="Share mission"
      >
        <Link2 className={iconSizes[size]} aria-hidden="true" />
        {showLabel && <span className="font-mono">Share</span>}
      </button>

      {children && (
        <button
          onClick={() => window.open(url, "_blank")}
          className={`inline-flex items-center ${sizeClasses[size]} rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950`}
          aria-label="Open in new tab"
        >
          <ExternalLink className={iconSizes[size]} aria-hidden="true" />
          {showLabel && <span className="font-mono">Open</span>}
        </button>
      )}
    </div>
  );
}

export function MissionShareButton({ designUrl }: { designUrl: string }) {
  return (
    <ShareButton
      url={designUrl}
      text="Check out my mission design on NASAMAP"
      size="md"
      showLabel={true}
    />
  );
}