import type { Metadata } from "next";
import { RocketBuilder } from "@/components/tools/rocket-builder/RocketBuilder";

export const metadata: Metadata = { title: "Rocket Builder — Design & Analyze Launch Vehicles" };

export default function RocketBuilderPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <RocketBuilder />
      </div>
    </div>
  );
}