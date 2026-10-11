"use client";

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  if (!mounted) return false;
  return isMobile;
}

interface MobileCanvasFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  breakpoint?: number;
}

export function MobileCanvasFallback({
  children,
  fallback,
  breakpoint = 768,
}: MobileCanvasFallbackProps) {
  const isMobile = useIsMobile(breakpoint);

  if (isMobile) {
    return (
      <div className="relative h-full w-full" role="img" aria-label="Mars surface operations simulation (static view)">
        {fallback || (
          <div className="flex h-full w-full items-center justify-center text-center">
            <div className="max-w-md p-6">
              <div className="aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-space-900 via-space-950 to-red-950/30 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('/mars-surface-placeholder.svg')" }} />
                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 text-white">
                  <div className="flex items-center gap-2 rounded-full border border-space-cyan/40 bg-space-cyan/20 px-4 py-2 text-sm font-medium text-space-cyan">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-space-cyan opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-space-cyan" />
                    </span>
                    Live Simulation
                  </div>
                  <p className="text-slate-300">Mars Surface Ops — Interactive 3D View</p>
                  <p className="text-sm text-slate-500">
                    This interactive simulation shows a full Martian sol: solar array tracking the sun,{" "}
                    battery charging/discharging, and habitat power balance.{" "}
                    <a href="/mission?d=mars" className="text-space-cyan hover:underline ml-1">
                      View full mission design →
                    </a>
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-space-cyan font-mono text-lg">14.2 kW</p>
                      <p className="text-slate-500">Peak Generation</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-space-emerald font-mono text-lg">12.3 h</p>
                      <p className="text-slate-500">Daylight / Sol</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-space-amber font-mono text-lg">48 kWh</p>
                      <p className="text-slate-500">Battery Reserve</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Rotate device or view on desktop for interactive 3D simulation
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}