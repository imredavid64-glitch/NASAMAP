import { FarmerDashboard } from "./FarmerDashboard";

export const metadata = { title: "Farmer's Sky Card — NASAMAP" };

export default function FarmerPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <FarmerDashboard />
      </div>
    </div>
  );
}