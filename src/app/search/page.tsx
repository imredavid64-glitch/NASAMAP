import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";

export const metadata = { title: "Search — Full-text search across articles, personas, vehicles, and celestial bodies" };

// Force dynamic rendering to avoid static generation issues with useSearchParams in Nav
export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-28 mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8 text-center"><div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-space-cyan/30 border-t-space-cyan" /><p className="text-slate-400">Loading search...</p></div>}>
      <SearchClient />
    </Suspense>
  );
}