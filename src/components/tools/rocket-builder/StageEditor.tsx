import { useMemo } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageConfig, Engine, Tank, RocketDesign } from "@/lib/rocket-builder";

interface StageEditorProps {
  design: RocketDesign;
  onUpdate: (design: RocketDesign) => void;
  engines: Engine[];
  tanks: Tank[];
}

const PROPELLANT_COLORS: Record<string, string> = {
  "RP-1/LOX": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "LH2/LOX": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "CH4/LOX": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Solid (APCP)": "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function StageCard({
  stage,
  index,
  engines,
  tanks,
  onUpdateStage,
  onRemoveStage,
  onMoveUp,
  onMoveDown,
}: {
  stage: StageConfig;
  index: number;
  engines: Engine[];
  tanks: Tank[];
  onUpdateStage: (stageIndex: number, updates: Partial<StageConfig>) => void;
  onRemoveStage: (stageIndex: number) => void;
  onMoveUp: (stageIndex: number) => void;
  onMoveDown: (stageIndex: number) => void;
}) {
  const stageTank = tanks.find((t) => t.id === stage.tankId);
  const tankPropellant = stageTank?.type ?? "Unknown";
  const propellantClass = PROPELLANT_COLORS[tankPropellant] ?? "bg-white/5 text-slate-400 border-white/10";

  const stageEngines = stage.engines.map((e) => {
    const engine = engines.find((eng) => eng.id === e.engineId);
    return { ...e, engine };
  });

  const hasMixedPropellants = stageEngines.length > 1 &&
    new Set(stageEngines.map((e) => e.engine?.propellant).filter(Boolean)).size > 1;

  const propellantMismatch = stageTank && stageEngines.length > 0 &&
    stageEngines.some((e) => e.engine && !stageTank.type.includes(e.engine.propellant.split("/")[0]));

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      {/* Drag handle + name + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 rounded hover:bg-white/10 text-slate-400 cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={stage.name}
            onChange={(e) => onUpdateStage(index, { name: e.target.value })}
            className="bg-transparent border-none text-white font-mono text-sm focus:outline-none w-48"
            placeholder="Stage name"
          />
          <Badge className={propellantClass} tone="slate">
            {tankPropellant}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {index > 0 && (
            <button
              onClick={() => onMoveUp(index)}
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 transition"
              aria-label="Move stage up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {index < 10 && (
            <button
              onClick={() => onMoveDown(index)}
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 transition"
              aria-label="Move stage down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onRemoveStage(index)}
            className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition"
            aria-label="Remove stage"
            disabled={true} // Keep at least one stage
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Warnings */}
      {(hasMixedPropellants || propellantMismatch) && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {hasMixedPropellants && "Mixed engine propellants in one stage — not modeled."}
            {propellantMismatch && (hasMixedPropellants ? " " : "")}
            {propellantMismatch && "Engine propellant may not match tank type."}
          </span>
        </div>
      )}

      {/* Tank Selector */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Propellant Tank</label>
        <select
          value={stage.tankId}
          onChange={(e) => onUpdateStage(index, { tankId: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
        >
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.propellantMassKg.toLocaleString()} kg prop, {t.dryMassKg.toLocaleString()} kg dry ({t.type})
            </option>
          ))}
        </select>
      </div>

      {/* Engines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-slate-400">Engines</label>
          <button
            onClick={() => onUpdateStage(index, {
              engines: [...stage.engines, { engineId: "merlin-1d", count: 1 }]
            })}
            className="inline-flex items-center gap-1.5 text-xs text-space-cyan hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Engine
          </button>
        </div>

        {stage.engines.map((engineEntry, eIdx) => (
          <div key={eIdx} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
            <select
              value={engineEntry.engineId}
              onChange={(e) => {
                const newEngines = [...stage.engines];
                newEngines[eIdx] = { ...newEngines[eIdx], engineId: e.target.value };
                onUpdateStage(index, { engines: newEngines });
              }}
              className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60 min-w-0"
            >
              {engines.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name} ({eng.thrustVacuumKg.toLocaleString()} kg vac, {eng.ispVacuumS}s Isp, {eng.propellant})
                </option>
              ))}
            </select>
            <input
              type="number"
              value={engineEntry.count}
              onChange={(e) => {
                const newEngines = [...stage.engines];
                newEngines[eIdx] = { ...newEngines[eIdx], count: Math.max(1, Number(e.target.value) || 1) };
                onUpdateStage(index, { engines: newEngines });
              }}
              min={1}
              max={100}
              className="w-16 rounded-lg border border-white/10 bg-space-950/60 px-2 py-2 text-sm text-white text-center outline-none focus:border-space-cyan/60"
            />
            <span className="text-xs text-slate-500">×</span>
            <button
              onClick={() => {
                const newEngines = stage.engines.filter((_, i) => i !== eIdx);
                onUpdateStage(index, { engines: newEngines });
              }}
              className="p-1 rounded hover:bg-red-500/10 text-red-400 transition"
              aria-label="Remove engine"
              disabled={stage.engines.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Stage Mass Overrides */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Interstage Mass (kg)</label>
          <input
            type="number"
            value={stage.interstageMassKg}
            onChange={(e) => onUpdateStage(index, { interstageMassKg: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Avionics Mass (kg)</label>
          <input
            type="number"
            value={stage.avionicsMassKg}
            onChange={(e) => onUpdateStage(index, { avionicsMassKg: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">TPS Mass (kg)</label>
          <input
            type="number"
            value={stage.tpsMassKg}
            onChange={(e) => onUpdateStage(index, { tpsMassKg: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Recovery Hardware Mass (kg)</label>
          <input
            type="number"
            value={stage.recoveryMassKg}
            onChange={(e) => onUpdateStage(index, { recoveryMassKg: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`booster-${index}`}
          checked={stage.isBooster}
          onChange={(e) => onUpdateStage(index, { isBooster: e.target.checked })}
          className="rounded border-white/20 text-space-cyan focus:ring-space-cyan"
        />
        <label htmlFor={`booster-${index}`} className="text-sm text-slate-300">
          Booster (parallel stage)
        </label>
      </div>
    </div>
  );
}

export function StageEditor({ design, onUpdate, engines, tanks }: StageEditorProps) {
  const handleUpdateStage = (stageIndex: number, updates: Partial<StageConfig>) => {
    const newStages = [...design.stages];
    newStages[stageIndex] = { ...newStages[stageIndex], ...updates };
    onUpdate({ ...design, stages: newStages });
  };

  const handleAddStage = () => {
    const newStage = {
      id: `stage-${Date.now()}`,
      name: `Stage ${design.stages.length + 1}`,
      engines: [{ engineId: "merlin-1d", count: 1 }],
      tankId: "falcon-9-tank",
      interstageMassKg: 500,
      avionicsMassKg: 200,
      tpsMassKg: 100,
      recoveryMassKg: 0,
      isBooster: false,
      separationMechanism: "pyrotechnic" as const,
    };
    onUpdate({ ...design, stages: [...design.stages, newStage] });
  };

  const handleRemoveStage = (stageIndex: number) => {
    if (design.stages.length <= 1) return;
    const newStages = design.stages.filter((_, i) => i !== stageIndex);
    onUpdate({ ...design, stages: newStages });
  };

  const handleMoveUp = (stageIndex: number) => {
    if (stageIndex === 0) return;
    const newStages = [...design.stages];
    [newStages[stageIndex - 1], newStages[stageIndex]] = [newStages[stageIndex], newStages[stageIndex - 1]];
    onUpdate({ ...design, stages: newStages });
  };

  const handleMoveDown = (stageIndex: number) => {
    if (stageIndex >= design.stages.length - 1) return;
    const newStages = [...design.stages];
    [newStages[stageIndex + 1], newStages[stageIndex]] = [newStages[stageIndex], newStages[stageIndex + 1]];
    onUpdate({ ...design, stages: newStages });
  };

  const totalStages = design.stages.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Stages ({totalStages})</h3>
          <Badge tone="slate" className="text-xs">
            Top = first to fire
          </Badge>
        </div>
        <Button onClick={handleAddStage} size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5" /> Add Stage
        </Button>
      </div>

      <div className="space-y-4">
        {design.stages.map((stage, i) => (
          <StageCard
            key={stage.id}
            stage={stage}
            index={i}
            engines={engines}
            tanks={tanks}
            onUpdateStage={handleUpdateStage}
            onRemoveStage={handleRemoveStage}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}
      </div>

      {/* Rocket-level properties */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 pt-6 border-t border-white/10">
        <h4 className="font-semibold text-white">Vehicle Properties</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vehicle Name</label>
            <input
              type="text"
              value={design.name}
              onChange={(e) => onUpdate({ ...design, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={design.description}
              onChange={(e) => onUpdate({ ...design, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}