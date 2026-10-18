import { Suspense } from "react";
import { LaunchWindowCalendar } from "@/components/tools/launch-window-calendar";

export const metadata = { title: "Launch Window Calendar — Earth→Mars Transfer Opportunities" };

// Force dynamic rendering to avoid static generation issues with useSearchParams in Nav
export const dynamic = 'force-dynamic';

export default function LaunchWindowsPage() {
  return (
    <div className="pt-28">
      <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading launch window calendar...</div>}>
        <LaunchWindowCalendar />
      </Suspense>
    </div>
  );
}