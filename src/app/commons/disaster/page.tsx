import { DisasterDashboard } from "./DisasterDashboard";

export const metadata = { title: "Disaster & Climate Dashboard — NASAMAP" };

export default function DisasterPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <DisasterDashboard />
      </div>
    </div>
  );
}