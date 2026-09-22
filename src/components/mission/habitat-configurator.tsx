"use client";

import { useState, useMemo } from "react";
import { Plus, Minus, Trash2, Home, FlaskConical, Leaf, Wrench, Shield, Droplet, Zap, Box, Maximize2, Minimize2, Info, X } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface HabitatModule {
  id: string;
  name: string;
  type: "inflatable" | "rigid" | "airlock" | "lab" | "greenhouse" | "storage" | "custom";
  massKg: number;
  volumeM3: number;
  powerKw: number;
  crewCapacity: number;
  o2KgPerDay: number;
  waterKgPerDay: number;
  co2KgPerDay: number;
  description: string;
  icon: string;
}

const MODULE_PRESETS: HabitatModule[] = [
  {
    id: "inflatable-hab",
    name: "Inflatable Habitat (BA-330 class)",
    type: "inflatable",
    massKg: 23000,
    volumeM3: 330,
    powerKw: 3.5,
    crewCapacity: 6,
    o2KgPerDay: 0.1,
    waterKgPerDay: 0.5,
    co2KgPerDay: 0.1,
    description: "Bigelow-style expandable module. High volume-to-mass ratio. Requires micrometeoroid shielding.",
    icon: "🏠",
  },
  {
    id: "rigid-hab",
    name: "Rigid Habitat (ISS Destiny class)",
    type: "rigid",
    massKg: 14500,
    volumeM3: 106,
    powerKw: 2.8,
    crewCapacity: 4,
    o2KgPerDay: 0.08,
    waterKgPerDay: 0.3,
    co2KgPerDay: 0.08,
    description: "Traditional rigid aluminum module. Proven heritage, lower volume per mass.",
    icon: "🏗️",
  },
  {
    id: "airlock",
    name: "Airlock (EVA)",
    type: "airlock",
    massKg: 4500,
    volumeM3: 34,
    powerKw: 1.2,
    crewCapacity: 0,
    o2KgPerDay: 0.02,
    waterKgPerDay: 0.05,
    co2KgPerDay: 0.01,
    description: "Dual-chamber airlock for EVA operations. Includes suit stowage and depress pump.",
    icon: "🚪",
  },
  {
    id: "science-lab",
    name: "Science Laboratory",
    type: "lab",
    massKg: 12000,
    volumeM3: 85,
    powerKw: 5.5,
    crewCapacity: 2,
    o2KgPerDay: 0.15,
    waterKgPerDay: 0.8,
    co2KgPerDay: 0.15,
    description: "Fully equipped lab for geology, biology, and materials science. High power draw.",
    icon: "🔬",
  },
  {
    id: "greenhouse",
    name: "Greenhouse / Food Production",
    type: "greenhouse",
    massKg: 8000,
    volumeM3: 120,
    powerKw: 8.5,
    crewCapacity: 0,
    o2KgPerDay: -0.5, // Produces O2
    waterKgPerDay: 2.5, // Consumes water
    co2KgPerDay: -0.5, // Consumes CO2
    description: "Hydroponic food production. Produces O2 and food, consumes water and power. Net positive O2.",
    icon: "🌱",
  },
  {
    id: "storage",
    name: "Logistics / Storage Module",
    type: "storage",
    massKg: 5000,
    volumeM3: 200,
    powerKw: 0.5,
    crewCapacity: 0,
    o2KgPerDay: 0,
    waterKgPerDay: 0,
    co2KgPerDay: 0,
    description: "Unpressurized/logistics storage. Low power, high volume for spares, rovers, ISRU equipment.",
    icon: "📦",
  },
  {
    id: "isru-plant",
    name: "ISRU Processing Plant",
    type: "custom",
    massKg: 15000,
    volumeM3: 60,
    powerKw: 25.0,
    crewCapacity: 0,
    o2KgPerDay: 5.0, // Produces O2 from regolith
    waterKgPerDay: 2.0, // Produces water from ice
    co2KgPerDay: 0,
    description: "MOXIE-scale O2 production + water extraction from regolith/ice. High power, enables ISRU.",
    icon: "⚙️",
  },
];

const MODULE_TYPE_INFO: Record<HabitatModule["type"], { label: string; color: string }> = {
  inflatable: { label: "Inflatable", color: "emerald" },
  rigid: { label: "Rigid", color: "cyan" },
  airlock: { label: "Airlock", color: "amber" },
  lab: { label: "Lab", color: "violet" },
  greenhouse: { label: "Greenhouse", color: "emerald" },
  storage: { label: "Storage", color: "slate" },
  custom: { label: "ISRU", color: "orange" },
};

interface SelectedModule extends HabitatModule {
  quantity: number;
}

export function HabitatConfigurator({ 
  design, 
  onChange 
}: { 
  design: { destination: "moon" | "mars"; crew: number; totalDays: number; payloadCapacityKg?: number };
  onChange?: (modules: SelectedModule[]) => void;
}) {
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([
    { ...MODULE_PRESETS[0], quantity: 1 }, // Start with one inflatable habitat
    { ...MODULE_PRESETS[2], quantity: 1 }, // Start with one airlock
  ]);
  const [showPresets, setShowPresets] = useState(false);
  const [customModule, setCustomModule] = useState<HabitatModule & { quantity: number }>({
    id: "",
    name: "",
    type: "custom",
    massKg: 0,
    volumeM3: 0,
    powerKw: 0,
    crewCapacity: 0,
    o2KgPerDay: 0,
    waterKgPerDay: 0,
    co2KgPerDay: 0,
    description: "",
    icon: "⚙️",
    quantity: 1,
  });

  const totals = useMemo(() => {
    return selectedModules.reduce(
      (acc, mod) => ({
        massKg: acc.massKg + mod.massKg * mod.quantity,
        volumeM3: acc.volumeM3 + mod.volumeM3 * mod.quantity,
        powerKw: acc.powerKw + mod.powerKw * mod.quantity,
        crewCapacity: acc.crewCapacity + mod.crewCapacity * mod.quantity,
        o2KgPerDay: acc.o2KgPerDay + mod.o2KgPerDay * mod.quantity,
        waterKgPerDay: acc.waterKgPerDay + mod.waterKgPerDay * mod.quantity,
        co2KgPerDay: acc.co2KgPerDay + mod.co2KgPerDay * mod.quantity,
        count: acc.count + mod.quantity,
      }),
      { massKg: 0, volumeM3: 0, powerKw: 0, crewCapacity: 0, o2KgPerDay: 0, waterKgPerDay: 0, co2KgPerDay: 0, count: 0 }
    );
  }, [selectedModules]);

  const payloadCapacityKg = design.payloadCapacityKg ?? 0;
  const massMargin = payloadCapacityKg - totals.massKg;
  const massMarginPct = payloadCapacityKg > 0 ? (massMargin / payloadCapacityKg) * 100 : 0;

  const addPreset = (module: HabitatModule) => {
    const existing = selectedModules.find(m => m.id === module.id);
    if (existing) {
      setSelectedModules(selectedModules.map(m => 
        m.id === module.id ? { ...m, quantity: m.quantity + 1 } : m
      ));
    } else {
      setSelectedModules([...selectedModules, { ...module, quantity: 1 }]);
    }
    setShowPresets(false);
  };

  const removeModule = (id: string) => {
    setSelectedModules(selectedModules.filter(m => m.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedModules(selectedModules.map(m => {
      if (m.id === id) {
        const newQty = Math.max(0, m.quantity + delta);
        return newQty === 0 ? null : { ...m, quantity: newQty };
      }
      return m;
    }).filter(Boolean) as SelectedModule[]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModule.name || customModule.massKg <= 0) return;
    const newModule: SelectedModule = {
      ...customModule as HabitatModule,
      id: `custom-${Date.now()}`,
      quantity: customModule.quantity,
    };
    setSelectedModules([...selectedModules, newModule]);
    setCustomModule({ ...customModule, name: "", massKg: 0, volumeM3: 0, powerKw: 0, crewCapacity: 0, o2KgPerDay: 0, waterKgPerDay: 0, co2KgPerDay: 0, description: "", quantity: 1 });
  };

  // Call onChange when modules change
  useMemo(() => {
    onChange?.(selectedModules);
  }, [selectedModules, onChange]);

  return (
    <Card className="glass-panel">
      <CardBody>
        <div className="flex items-center justify-between gap-4 mb-4">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-4 w-4 text-space-emerald" />
            Habitat Configurator
            <Badge tone="emerald" className="text-xs">{totals.count} modules</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-1.5 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add Module
            </button>
            <button
              onClick={() => setCustomModule({ ...customModule, id: "", name: "", massKg: 0, volumeM3: 0, powerKw: 0, crewCapacity: 0, o2KgPerDay: 0, waterKgPerDay: 0, co2KgPerDay: 0, description: "", quantity: 1 })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            >
              <Info className="h-3.5 w-3.5" /> Custom
            </button>
          </div>
        </div>

        {/* Habitat Totals Summary */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4">
            <StatCard 
              label="Total Mass" 
              value={`${(totals.massKg / 1000).toFixed(1)} t`} 
              icon={<Box className="h-4 w-4 text-space-cyan" />}
              sub={payloadCapacityKg > 0 ? `${massMargin >= 0 ? "+" : ""}${((massMargin) / 1000).toFixed(1)} t margin` : "no payload limit"}
              subColor={massMargin >= 0 ? "text-space-emerald" : "text-red-400"}
            />
            <StatCard 
              label="Volume" 
              value={`${totals.volumeM3.toFixed(0)} m³`} 
              icon={<Maximize2 className="h-4 w-4 text-space-cyan" />} 
            />
            <StatCard 
              label="Power" 
              value={`${totals.powerKw.toFixed(1)} kW`} 
              icon={<Zap className="h-4 w-4 text-space-amber" />} 
            />
            <StatCard 
              label="O₂ Net/Day" 
              value={`${totals.o2KgPerDay >= 0 ? "+" : ""}${totals.o2KgPerDay.toFixed(2)} kg`} 
              icon={<Droplet className="h-4 w-4 text-space-emerald" />}
              sub={totals.o2KgPerDay < 0 ? "Net producer" : "Net consumer"}
              subColor={totals.o2KgPerDay < 0 ? "text-space-emerald" : "text-amber-400"}
            />
            <StatCard 
              label="Crew Capacity" 
              value={totals.crewCapacity.toString()} 
              icon={<Info className="h-4 w-4 text-space-cyan" />}
            />
          </div>

          {payloadCapacityKg > 0 && (
            <div className="h-3 bg-space-950/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-space-emerald rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, 50 + massMarginPct / 2))}%` }}
              />
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Habitat mass: <strong className="text-white font-mono">{(totals.massKg / 1000).toFixed(1)} t</strong></span>
            {payloadCapacityKg > 0 && (
              <span className={cn("font-mono", massMargin >= 0 ? "text-space-emerald" : "text-red-400")}>
                Margin: {massMargin >= 0 ? "+" : ""}{(massMargin / 1000).toFixed(1)} t (${massMarginPct.toFixed(0)}%)
              </span>
            )}
          </div>
        </div>

        {/* Module List */}
        <div className="space-y-3 mb-6">
          {selectedModules.map((mod, idx) => (
            <ModuleCard
              key={`${mod.id}-${idx}`}
              module={mod}
              index={idx}
              onQuantityChange={(delta) => updateQuantity(mod.id, delta)}
              onRemove={() => removeModule(mod.id)}
            />
          ))}
          {selectedModules.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Home className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p>No habitat modules added. Click "Add Module" to start designing.</p>
            </div>
          )}
        </div>

        {/* Preset Module Picker */}
        {showPresets && (
          <div className="mb-6 p-4 rounded-xl border border-space-cyan/30 bg-space-cyan/5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white">Add Preset Module</span>
              <button onClick={() => setShowPresets(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_PRESETS.map((mod) => (
                <PresetModuleCard key={mod.id} module={mod} onAdd={() => addPreset(mod)} />
              ))}
            </div>
          </div>
        )}

        {/* Custom Module Builder */}
        {customModule.id || customModule.name || customModule.massKg > 0 ? (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-amber-400 flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Custom Module Builder
              </span>
              <button onClick={() => setCustomModule({ ...customModule, id: "", name: "", massKg: 0, volumeM3: 0, powerKw: 0, crewCapacity: 0, o2KgPerDay: 0, waterKgPerDay: 0, co2KgPerDay: 0, description: "", quantity: 1 })} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={customModule.name}
                  onChange={(e) => setCustomModule({ ...customModule, name: e.target.value })}
                  placeholder="Module name (e.g., Medical Bay)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                  required
                />
                <select
                  value={customModule.type}
                  onChange={(e) => setCustomModule({ ...customModule, type: e.target.value as HabitatModule["type"] })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {Object.entries(MODULE_TYPE_INFO).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customModule.massKg}
                  onChange={(e) => setCustomModule({ ...customModule, massKg: Number(e.target.value) })}
                  placeholder="Mass (kg)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={customModule.volumeM3}
                  onChange={(e) => setCustomModule({ ...customModule, volumeM3: Number(e.target.value) })}
                  placeholder="Volume (m³)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={customModule.powerKw}
                  onChange={(e) => setCustomModule({ ...customModule, powerKw: Number(e.target.value) })}
                  placeholder="Power (kW)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customModule.crewCapacity}
                  onChange={(e) => setCustomModule({ ...customModule, crewCapacity: Number(e.target.value) })}
                  placeholder="Crew capacity"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <input
                  type="number"
                  min="-100"
                  max="100"
                  step="0.01"
                  value={customModule.o2KgPerDay}
                  onChange={(e) => setCustomModule({ ...customModule, o2KgPerDay: Number(e.target.value) })}
                  placeholder="O₂ net/day (kg, neg = produces)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={customModule.waterKgPerDay}
                  onChange={(e) => setCustomModule({ ...customModule, waterKgPerDay: Number(e.target.value) })}
                  placeholder="Water/day (kg)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <input
                  type="number"
                  min="-100"
                  max="100"
                  step="0.01"
                  value={customModule.co2KgPerDay}
                  onChange={(e) => setCustomModule({ ...customModule, co2KgPerDay: Number(e.target.value) })}
                  placeholder="CO₂ net/day (kg, neg = consumes)"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                />
              </div>
              <textarea
                value={customModule.description}
                onChange={(e) => setCustomModule({ ...customModule, description: e.target.value })}
                placeholder="Description / notes"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={customModule.quantity}
                    onChange={(e) => setCustomModule({ ...customModule, quantity: Number(e.target.value) })}
                    className="w-16 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
                  />
                  Quantity
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Custom Module
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Mass Budget Integration Note */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
          <p className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 text-space-cyan" />
            <span>
              <strong>Integration:</strong> Habitat mass is included in the mission stack mass budget. 
              The payload capacity margin above shows remaining capacity for habitat + cargo + consumables.
              Greenhouse O₂ production offsets crew consumption. ISRU plant produces O₂/water from local resources.
            </span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function ModuleCard({ module, index, onQuantityChange, onRemove }: { 
  module: SelectedModule; 
  index: number; 
  onQuantityChange: (delta: number) => void; 
  onRemove: () => void; 
}) {
  const typeInfo = MODULE_TYPE_INFO[module.type];
  const moduleMassKg = module.massKg * module.quantity;
  const modulePowerKw = module.powerKw * module.quantity;
  const moduleVolumeM3 = module.volumeM3 * module.quantity;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{module.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate">{module.name}</span>
              <Badge tone={typeInfo.color as any} className="text-[10px]">{typeInfo.label}</Badge>
              {module.quantity > 1 && (
                <Badge tone="slate" className="text-[10px]">×{module.quantity}</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400 truncate">{module.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><Box className="h-3 w-3" /> {moduleMassKg.toLocaleString()} kg</span>
              <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" /> {moduleVolumeM3} m³</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {modulePowerKw.toFixed(1)} kW</span>
              {module.crewCapacity > 0 && <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Crew {module.crewCapacity * module.quantity}</span>}
              {(module.o2KgPerDay !== 0 || module.waterKgPerDay !== 0 || module.co2KgPerDay !== 0) && (
                <span className="flex items-center gap-1">
                  <Droplet className="h-3 w-3" /> 
                  O₂ {module.o2KgPerDay >= 0 ? "+" : ""}{(module.o2KgPerDay * module.quantity).toFixed(2)} 
                  H₂O {(module.waterKgPerDay * module.quantity).toFixed(2)} 
                  CO₂ {module.co2KgPerDay >= 0 ? "+" : ""}{(module.co2KgPerDay * module.quantity).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onQuantityChange(-1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-mono text-sm text-white">{module.quantity}</span>
          <button
            onClick={() => onQuantityChange(1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="ml-2 p-1.5 rounded-lg hover:bg-red-500/20 transition text-red-400 hover:text-red-300"
            aria-label="Remove module"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PresetModuleCard({ module, onAdd }: { module: HabitatModule; onAdd: () => void }) {
  const typeInfo = MODULE_TYPE_INFO[module.type];

  return (
    <button
      onClick={onAdd}
      className="relative p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-space-cyan/40 hover:bg-space-cyan/5 transition text-left group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{module.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{module.name}</span>
            <Badge tone={typeInfo.color as any} className="text-[10px]">{typeInfo.label}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400 truncate">{module.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Box className="h-3 w-3" /> {module.massKg.toLocaleString()} kg</span>
            <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" /> {module.volumeM3} m³</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {module.powerKw.toFixed(1)} kW</span>
            {module.crewCapacity > 0 && <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Crew {module.crewCapacity}</span>}
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-space-cyan/20 border border-space-cyan/40 px-2.5 py-1 text-[10px] font-medium text-space-cyan">
          <Plus className="h-3 w-3" /> Add
        </span>
      </div>
    </button>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  sub, 
  subColor 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  sub?: string; 
  subColor?: string; 
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="font-mono text-lg text-white">{value}</p>
      {sub && <p className={cn("mt-1 text-[10px]", subColor)}>{sub}</p>}
    </div>
  );
}