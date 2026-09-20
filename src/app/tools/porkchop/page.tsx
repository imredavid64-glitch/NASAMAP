import { PorkchopPlot } from "@/components/mission/porkchop-plot";

export const metadata = { title: "Porkchop Plot — Earth→Mars Transfer Analysis" };

export default function PorkchopPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <PorkchopPlot />
      </div>
    </div>
  );
}