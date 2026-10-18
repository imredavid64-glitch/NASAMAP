import { Suspense } from "react";
import { JudgeTourContent } from "@/components/judge-tour";

export const metadata = { title: "Judge Tour — NASAMAP Evaluation Guide" };

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function JudgePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-space-950"><div className="text-center"><div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-space-cyan/30 border-t-space-cyan" /><p className="text-slate-400">Loading judge tour...</p></div></div>}>
      <JudgeTourContent />
    </Suspense>
  );
}