import { Suspense } from "react";
import { CommunityClient } from "./CommunityClient";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunitySkeleton />}>
      <CommunityClient />
    </Suspense>
  );
}

function CommunitySkeleton() {
  return (
    <div className="pt-28 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-1/4 mb-8" />
      <div className="h-12 bg-white/10 rounded w-full mb-8" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-20 bg-white/10 rounded" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-white/10 rounded" />
              <div className="h-16 bg-white/10 rounded" />
              <div className="h-16 bg-white/10 rounded" />
            </div>
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}