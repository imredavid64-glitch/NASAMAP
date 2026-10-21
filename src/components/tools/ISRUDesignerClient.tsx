"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const ISRUPlantDesigner = dynamic(
  () => import("@/components/tools/isru-designer/ISRUPlantDesigner").then((mod) => mod.ISRUPlantDesigner),
  { ssr: false, loading: () => <ISRUPlantDesignerSkeleton /> }
);

export function ISRUDesignerClient() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="kicker mb-3">Tools · ISRU Designer</p>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            ISRU Plant Designer
          </h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Design in-situ resource utilization plants for Moon and Mars missions. 
            Drag processes onto the canvas, connect them, and see real-time mass balance, power, and mass budgets.
          </p>
        </div>

        <div className="space-y-10">
          {/* Designer canvas — needs the full width; it brings its own toolbar, palette and metrics. */}
          <div className="min-h-[640px]">
            <Suspense fallback={<ISRUPlantDesignerSkeleton />}>
              <ISRUPlantDesigner location="mars" crew={4} missionDurationDays={180} />
            </Suspense>
          </div>

          {/* Supporting documentation */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-4">About ISRU Plant Design</h2>
              <div className="space-y-4 text-slate-300">
                <p>
                  In-situ Resource Utilization (ISRU) is the practice of harvesting and processing local materials 
                  to reduce the mass that must be launched from Earth. This designer lets you build process flows 
                  using real NASA-researched technologies.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProcessCategoryCard 
                    title="Thermal Processes" 
                    icon={<span className="text-orange-400">🔥</span>}
                    processes={["OSCAR Thermal Decomposition", "Regolith Water Extraction"]}
                    description="High-temperature processing of waste and regolith to release volatiles"
                  />
                  <ProcessCategoryCard 
                    title="Chemical Processes" 
                    icon={<span className="text-purple-400">⚗️</span>}
                    processes={["Sabatier CO2 Reduction", "Methane Pyrolysis"]}
                    description="Catalytic reactions to convert CO2 and H2 into water, methane, and oxygen"
                  />
                  <ProcessCategoryCard 
                    title="Electrolysis" 
                    icon={<span className="text-cyan-400">⚡</span>}
                    processes={["Water Electrolysis (PEM)", "Solid Oxide CO2 Electrolysis"]}
                    description="Electrical splitting of water and CO2 into constituent elements"
                  />
                  <ProcessCategoryCard 
                    title="Separation" 
                    icon={<span className="text-emerald-400">🔬</span>}
                    processes={["CO2 Capture (4BMS)", "Brine Processor", "Water Electrolysis"]}
                    description="Separation of gases and liquids from mixed streams"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Key Design Principles</h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">1</span>
                  <span><strong>Start with waste:</strong> OSCAR thermal decomposition processes crew waste into H₂O, CO₂, CH₄, and char</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">2</span>
                  <span><strong>Capture CO₂:</strong> 4BMS captures cabin CO₂ for Sabatier reactor or direct electrolysis</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">3</span>
                  <span><strong>Close the loop:</strong> Water electrolysis + Sabatier recovers ~50% O₂ and ~90% H₂O (ISS heritage)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">4</span>
                  <span><strong>Add ISRU:</strong> Mars regolith extraction adds local water; methane pyrolysis closes carbon loop</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">5</span>
                  <span><strong>Check TRL:</strong> Each process shows Technology Readiness Level (1-9); plant TRL = minimum of all processes</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">NASA References</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex gap-2">
                  <span className="font-mono text-space-cyan">OSCAR:</span>
                  <span>NASA Orbital Syngas Commodity Augmentation Reactor (TRL 5)</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-space-cyan">Sabatier/CDRA:</span>
                  <span>ISS Carbon Dioxide Reduction Assembly (TRL 8-9)</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-space-cyan">Water Electrolysis:</span>
                  <span>ISS Oxygen Generation Assembly - PEM (TRL 9)</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-space-cyan">Brine Processor:</span>
                  <span>ISS BPA - recovers water from urine brine (TRL 6)</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-space-cyan">Regolith Extraction:</span>
                  <span>NASA ISRU technology development (TRL 4)</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-space-cyan">CO2 Electrolysis:</span>
                  <span>MOXIE/SOCE technology (TRL 5)</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ISRUPlantDesignerSkeleton() {
  return (
    <div className="h-full w-full flex flex-col space-y-4 p-4 rounded-xl border border-white/10 bg-space-950/60 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-1/2" />
      <div className="h-64 bg-white/10 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white/10 rounded" />
        ))}
      </div>
    </div>
  );
}

function ProcessCategoryCard({ title, icon, processes, description }: { title: string; icon: React.ReactNode; processes: string[]; description: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="text-xs text-slate-400 mb-2">{description}</p>
      <ul className="space-y-1">
        {processes.map((p, i) => (
          <li key={i} className="text-sm text-slate-300 flex gap-2">
            <span className="text-space-cyan">▸</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}