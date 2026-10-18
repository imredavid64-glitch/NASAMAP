import Link from "next/link";
import { Rocket, RotateCcw } from "lucide-react";

// Force dynamic rendering to avoid static generation issues with useSearchParams in Nav
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-space-950 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 mx-auto">
          <Rocket className="h-10 w-10 text-space-cyan" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">404 — Not Found</h1>
          <p className="mt-2 text-slate-400">
            The mission you&apos;re looking for doesn&apos;t exist. Maybe it launched without you?
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-space-cyan px-6 py-3 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/80"
          >
            <RotateCcw className="h-4 w-4" /> Back to Mission Control
          </Link>
        </div>
      </div>
    </div>
  );
}