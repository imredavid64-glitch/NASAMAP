"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, WifiOff, Wifi, CheckCircle2, X, MonitorSmartphone, Clock, Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if running offline (service worker controlling page)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setSwRegistered(true);
        if (reg.active) {
          setIsOfflineMode(true);
        }
      });
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay (user has time to explore)
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    // Keyboard shortcut to show install prompt manually (Cmd/Ctrl + Shift + I)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        if (deferredPrompt && !isInstalled) {
          setShowPrompt(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = useCallback((remindTomorrow = false) => {
    setShowPrompt(false);
    if (remindTomorrow) {
      // Show again tomorrow
      localStorage.setItem("pwa-prompt-dismissed-until", String(Date.now() + 24 * 60 * 60 * 1000));
    } else {
      // Don't show again for this session
      sessionStorage.setItem("pwa-prompt-dismissed", "true");
    }
  }, []);

  // Don't show if dismissed this session or dismissed until tomorrow
  useEffect(() => {
    const sessionDismissed = sessionStorage.getItem("pwa-prompt-dismissed") === "true";
    const tomorrowDismissed = localStorage.getItem("pwa-prompt-dismissed-until");
    const dismissUntil = tomorrowDismissed ? Number(tomorrowDismissed) : 0;
    
    if (sessionDismissed || (dismissUntil > 0 && Date.now() < dismissUntil)) {
      setShowPrompt(false);
    } else if (dismissUntil > 0 && Date.now() >= dismissUntil) {
      // Dismissal period expired, clear it
      localStorage.removeItem("pwa-prompt-dismissed-until");
    }
  }, []);

  if (isInstalled) return null;

  return (
    <>
      {/* Offline indicator badge */}
      {(isOfflineMode || !isOnline) && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur px-3 py-2 text-xs font-medium text-amber-300 transition-opacity",
            !isOnline && "animate-pulse"
          )}
          role="status"
          aria-live="polite"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>{!isOnline ? "Offline — cached data active" : "Running offline (PWA)"}</span>
        </div>
      )}

      {/* Online + PWA indicator (subtle) */}
      {isOnline && isOfflineMode && !showPrompt && (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur px-2.5 py-1.5 text-[10px] font-medium text-emerald-300">
          <Wifi className="h-3 w-3 shrink-0" />
          <span className="hidden sm:inline">PWA ready — works offline</span>
        </div>
      )}

      {/* Install prompt banner */}
      {deferredPrompt && showPrompt && !isInstalled && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-slide-up"
          role="dialog"
          aria-label="Install NASAMAP"
        >
          <div className="glass-panel rounded-2xl border border-white/10 bg-space-950/90 backdrop-blur p-4 max-w-sm w-full mx-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
                  <MonitorSmartphone className="h-5 w-5 text-space-cyan" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Install NASAMAP</p>
                  <p className="text-[11px] text-slate-400">
                    Works offline. Mission designs saved locally. No account needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(false)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-space-cyan px-4 py-2.5 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/90 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
              >
                <Download className="h-4 w-4" />
                Install
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
              >
                <Clock className="h-4 w-4" />
                Remind me tomorrow
              </button>
              <button
                onClick={() => handleDismiss(false)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Later
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-500">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-slate-400 font-mono">
                {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Shift+I
              </kbd> to reopen
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}