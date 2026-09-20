"use client";

import Link from "next/link";

export default function Offline() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-space-950 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 mx-auto">
          <svg className="h-10 w-10 text-space-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="mt-2 text-slate-400">
            NASAMAP works offline! Most features are cached and ready to use.
            Live data feeds will show their last known snapshot until connection is restored.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-space-cyan px-6 py-3 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/80"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Cached features: Mission Lab, Play scenarios, Fly trajectories, Library, Challenges, Data Commons
        </p>
      </div>
    </div>
  );
}