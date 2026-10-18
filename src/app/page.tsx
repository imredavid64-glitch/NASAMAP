import { Suspense } from "react";
import { HomeContent } from "@/components/home-content";

export const metadata = {
  title: "NASAMAP — Every human has a seat at the frontier",
  description:
    "Plan, fly and live a real Moon-to-Mars mission. Turn cosmic data into everyday decisions for farmers, fishers, students and dreamers. No account. Open data. Built for the NASA Space Apps Challenge.",
};

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-space-950"><div className="h-12 w-12 animate-spin rounded-full border-4 border-space-cyan/30 border-t-space-cyan" /></div>}>
      <HomeContent />
    </Suspense>
  );
}