import Link from "next/link";
import { RetryButton } from "@/components/offline-retry-button";
import { WifiOff, Rocket } from "lucide-react";

// Force dynamic rendering for offline page
export const dynamic = 'force-dynamic';

export default function Offline() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-space-950 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 mx-auto">
          <WifiOff className="h-10 w-10 text-space-cyan" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="mt-2 text-slate-400">
            NASAMAP works offline! Most features are cached and ready to use.
            Live data feeds will show their last known snapshot until connection is restored.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/mission"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-space-cyan px-5 py-2.5 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/80"
          >
            <Rocket className="h-4 w-4" /> Plan a Mission
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Go Home
          </Link>
          <RetryButton />
        </div>
        <p className="text-xs text-slate-500">
          Cached features: Mission Lab, Play scenarios, Fly trajectories, Library, Challenges, Data Commons
        </p>
      </div>
    </div>
  );
}