import { Suspense } from "react";
import { ISRUDesignerClient } from "@/components/tools/ISRUDesignerClient";

export const metadata = { title: "ISRU Plant Designer — Design & Analyze ISRU Systems" };

// Force dynamic rendering to avoid static generation issues with useSearchParams in Nav
export const dynamic = 'force-dynamic';

export default function ISRUDesignerPage() {
  return (
    <Suspense fallback={<div className="pt-28 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 text-center"><div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-space-cyan/30 border-t-space-cyan" /><p className="text-slate-400">Loading ISRU designer...</p></div>}>
      <ISRUDesignerClient />
    </Suspense>
  );
}