"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { 
  Plus, Minus, Settings, Zap, Package, FlaskConical, 
  ArrowRight, ArrowLeft, Trash2, Copy, Check, AlertTriangle,
  ChevronDown, ChevronUp, Search, Filter
} from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ISRU_PROCESSES, ISRUProcess, ISRUPlant, ISRUMaterial, createDefaultISRUPlant, calculatePlantBalance, validatePlant } from "@/lib/isru";
import { cn } from "@/lib/cn";

interface ProcessNodeProps {
  process: ISRUProcess;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

function ProcessNode({ process, isSelected, onSelect, onRemove, position, onPositionChange }: ProcessNodeProps) {
  const categoryColors = {
    thermal: "bg-orange-500/20 border-orange-500/30 text-orange-400",
    chemical: "bg-purple-500/20 border-purple-500/30 text-purple-400",
    electrolysis: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
    separation: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
    storage: "bg-slate-500/20 border-slate-500/30 text-slate-400",
  };

  const categoryIcons = {
    thermal: <Zap className="h-4 w-4" />,
    chemical: <FlaskConical className="h-4 w-4" />,
    electrolysis: <Zap className="h-4 w-4" />,
    separation: <Package className="h-4 w-4" />,
    storage: <Package className="h-4 w-4" />,
  };

  const style = {
    position: "absolute" as const,
    left: position.x,
    top: position.y,
    zIndex: isSelected ? 10 : 1,
  };

  return (
    <div
      style={style}
      className={cn(
        "relative w-56 p-3 rounded-xl border transition-all duration-200",
        "bg-white/5 backdrop-blur",
        isSelected 
          ? "ring-2 ring-space-cyan scale-105 shadow-lg shadow-space-cyan/20"
          : "hover:ring-1 hover:ring-space-cyan/30",
        categoryColors[process.category]
      )}
      onClick={onSelect}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Drag handle */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove process"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${categoryColors[process.category].replace("text-", "bg-").replace("border-", "")} text-white`}>
          {categoryIcons[process.category]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{process.name}</p>
          <p className="text-[10px] text-slate-400 capitalize">{process.category}</p>
        </div>
      </div>

      {/* TRL Badge */}
      <div className="mb-3 flex items-center justify-between">
        <Badge 
          tone={process.trl >= 7 ? "emerald" : process.trl >= 5 ? "amber" : "crimson"} 
          className="text-[10px]"
        >
          TRL {process.trl}
        </Badge>
        <span className="text-[10px] text-slate-400">
          {process.powerKw} kW • {process.massKg} kg
        </span>
      </div>

      {/* Inputs */}
      <div className="mb-3 space-y-1">
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <ArrowRight className="h-2.5 w-2.5" /> Inputs
        </p>
        {process.inputs.map((input, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 pl-2 border-l border-white/10">
            <span className="font-mono text-space-cyan">{input.massKgPerDay.toFixed(1)} kg/day</span>
            <span className="font-medium text-white">{input.name}</span>
            <span className="text-slate-500">({input.state})</span>
          </div>
        ))}
      </div>

      {/* Outputs */}
      <div className="space-y-1">
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <ArrowLeft className="h-2.5 w-2.5" /> Outputs
        </p>
        {process.outputs.map((output, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 pl-2 border-l border-emerald-500/30">
            <span className="font-mono text-space-emerald">{output.massKgPerDay.toFixed(1)} kg/day</span>
            <span className="font-medium text-white">{output.name}</span>
            <span className="text-slate-500">({output.state})</span>
          </div>
        ))}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-space-cyan rounded-xl pointer-events-none" />
      )}
    </div>
  );
}

interface ISRUPlantDesignerProps {
  location: "moon" | "mars" | "exoplanet";
  crew: number;
  missionDurationDays: number;
  onPlantChange?: (plant: ISRUPlant) => void;
}

export function ISRUPlantDesigner({ location, crew, missionDurationDays, onPlantChange }: ISRUPlantDesignerProps) {
  const [plant, setPlant] = useState<ISRUPlant>(() => createDefaultISRUPlant(location, crew, missionDurationDays));
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ISRUProcess["category"] | "all">("all");
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize positions
  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = {};
    plant.processes.forEach((process, i) => {
      if (!nodePositions[process.id]) {
        const cols = 3;
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions[process.id] = { x: 20 + col * 280, y: 20 + row * 280 };
      }
    });
    if (Object.keys(newPositions).length > 0) {
      setNodePositions(prev => ({ ...prev, ...newPositions }));
    }
  }, [plant.processes.length]);

  // Auto-arrange
  const autoArrange = useCallback(() => {
    const newPositions: Record<string, { x: number; y: number }> = {};
    plant.processes.forEach((process, i) => {
      const cols = 3;
      const col = i % cols;
      const row = Math.floor(i / cols);
      newPositions[process.id] = { x: 20 + col * 280, y: 20 + row * 280 };
    });
    setNodePositions(newPositions);
  }, [plant]);

  // Balance calculation
  const balance = useMemo(() => calculatePlantBalance(plant), [plant]);
  const validation = useMemo(() => validatePlant(plant), [plant]);

  const handleAddProcess = (process: ISRUProcess) => {
    if (plant.processes.some(p => p.id === process.id)) return;
    
    const newPlant: ISRUPlant = {
      ...plant,
      processes: [...plant.processes, { ...process }],
    };
    
    // Recalculate totals
    const totalPowerKw = newPlant.processes.reduce((sum, p) => sum + p.powerKw, 0);
    const totalMassKg = newPlant.processes.reduce((sum, p) => sum + p.massKg, 0);
    const totalVolumeM3 = newPlant.processes.reduce((sum, p) => sum + p.volumeM3, 0);
    const trl = Math.min(...newPlant.processes.map(p => p.trl));
    
    const balance = calculatePlantBalance(newPlant);
    const validation = validatePlant(newPlant);

    setPlant({
      ...newPlant,
      totalPowerKw,
      totalMassKg,
      totalVolumeM3,
      trl,
      netInputs: balance.netInputs,
      netOutputs: balance.netOutputs,
    });
    setShowPalette(false);
    onPlantChange?.(newPlant);
  };

  const handleRemoveProcess = (processId: string) => {
    const newPlant: ISRUPlant = {
      ...plant,
      processes: plant.processes.filter(p => p.id !== processId),
    };
    const totalPowerKw = newPlant.processes.reduce((sum, p) => sum + p.powerKw, 0);
    const totalMassKg = newPlant.processes.reduce((sum, p) => sum + p.massKg, 0);
    const totalVolumeM3 = newPlant.processes.reduce((sum, p) => sum + p.volumeM3, 0);
    const trl = newPlant.processes.length > 0 ? Math.min(...newPlant.processes.map(p => p.trl)) : 9;
    const balance = calculatePlantBalance(newPlant);
    setPlant({
      ...newPlant,
      totalPowerKw,
      totalMassKg,
      totalVolumeM3,
      trl,
      netInputs: balance.netInputs,
      netOutputs: balance.netOutputs,
    });
    if (selectedProcessId === processId) setSelectedProcessId(null);
    onPlantChange?.(newPlant);
  };

  const handlePositionChange = (processId: string, position: { x: number; y: number }) => {
    setNodePositions(prev => ({ ...prev, [processId]: position }));
  };

const filteredProcesses = useMemo(() => {
    return ISRU_PROCESSES.filter((proc) => {
      const matchesSearch = proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           proc.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || proc.category === categoryFilter;
      const notAlreadyAdded = !plant.processes.some(p => p.id === proc.id);
      return matchesSearch && matchesCategory && notAlreadyAdded;
    });
  }, [searchQuery, categoryFilter, plant.processes]);

  // Handle canvas click to deselect
  const handleCanvasClick = () => {
    setSelectedProcessId(null);
  };

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search processes..."
            className="flex-1 min-w-0"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ISRUProcess["category"] | "all")}
            className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60 flex-1"
          >
            <option value="all">All Categories</option>
            <option value="thermal">Thermal</option>
            <option value="chemical">Chemical</option>
            <option value="electrolysis">Electrolysis</option>
            <option value="separation">Separation</option>
            <option value="storage">Storage</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={autoArrange}>
            <Package className="h-3.5 w-3.5 mr-1" /> Auto-arrange
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPalette(!showPalette)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Process
          </Button>
        </div>
      </div>

      {/* Process Palette */}
      {showPalette && filteredProcesses.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">Available Processes</p>
            <Button variant="ghost" size="sm" onClick={() => setShowPalette(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProcesses.map((proc) => (
              <Button
                key={proc.id}
                variant="outline"
                className="h-auto p-3 text-left text-sm justify-start gap-3"
                onClick={() => handleAddProcess(proc)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  {{
                    thermal: <Zap className="h-4 w-4 text-orange-400" />,
                    chemical: <FlaskConical className="h-4 w-4 text-purple-400" />,
                    electrolysis: <Zap className="h-4 w-4 text-cyan-400" />,
                    separation: <Package className="h-4 w-4 text-emerald-400" />,
                    storage: <Package className="h-4 w-4 text-slate-400" />,
                  }[proc.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{proc.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {proc.powerKw} kW • {proc.massKg} kg • TRL {proc.trl}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative min-h-[420px] flex-1 overflow-auto rounded-xl border border-white/10 bg-gradient-to-br from-space-950 to-space-900">
        <div
          ref={canvasRef}
          className="absolute inset-0"
          onClick={handleCanvasClick}
        >
          {/* Connection lines would go here */}
          
          {plant.processes.map((process) => {
            const position = nodePositions[process.id] || { x: 20, y: 20 };
            const isSelected = selectedProcessId === process.id;
            return (
              <ProcessNode
                key={process.id}
                process={process}
                isSelected={isSelected}
                onSelect={() => setSelectedProcessId(process.id)}
                onRemove={() => handleRemoveProcess(process.id)}
                position={position}
                onPositionChange={(pos) => handlePositionChange(process.id, pos)}
              />
            );
          })}

          {plant.processes.length === 0 && (
            <div className="flex h-full w-full items-center justify-center text-center p-8">
              <div className="max-w-md">
                <Package className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-white mb-2">No Processes Added</h3>
                <p className="text-slate-400 mb-4">
                  Build your ISRU plant by adding processes from the palette. 
                  Start with waste processing (OSCAR) and CO2 capture for Moon/Mars missions.
                </p>
                <Button onClick={() => setShowPalette(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Browse Processes
                </Button>
              </div>
            </div>
          )}

          {/* Connection lines placeholder */}
          <svg className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
            {/* Simple connection lines between compatible processes */}
            {plant.processes.map((source, i) => 
              plant.processes.slice(i + 1).map(target => {
                const sourcePos = nodePositions[source.id];
                const targetPos = nodePositions[target.id];
                if (!sourcePos || !targetPos) return null;
                
                // Check if they can connect
                const connections = (window as any).PROCESS_CONNECTIONS || {};
                const canConnect = connections[source.id]?.includes(target.id) || 
                                  connections[target.id]?.includes(source.id);
                
                if (!canConnect) return null;
                
                return (
                  <line
                    key={`${source.id}-${target.id}`}
                    x1={sourcePos.x + 224} // right edge of card
                    y1={sourcePos.y + 60}
                    x2={targetPos.x}
                    y2={targetPos.y + 60}
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    className="text-space-cyan/30"
                  />
                );
              })
            )}
          </svg>
        </div>

      </div>

      {/* Summary Panel */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label="Total Power" 
          value={`${plant.totalPowerKw.toFixed(1)} kW`} 
          icon={<Zap className="h-5 w-5" />} 
          tone="amber" 
        />
        <MetricCard 
          label="Total Mass" 
          value={`${(plant.totalMassKg / 1000).toFixed(1)} t`} 
          icon={<Package className="h-5 w-5" />} 
          tone="cyan" 
        />
        <MetricCard 
          label="Plant TRL" 
          value={plant.trl.toString()} 
          icon={<FlaskConical className="h-5 w-5" />} 
          tone={plant.trl >= 7 ? "emerald" : plant.trl >= 5 ? "amber" : "crimson"} 
        />
        <MetricCard 
          label="Processes" 
          value={plant.processes.length.toString()} 
          icon={<FlaskConical className="h-5 w-5" />} 
          tone="purple" 
        />
      </div>

      {/* Mass Balance */}
      <Card className="mt-4">
        <CardBody>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-space-cyan" /> Mass Balance (kg/day)
          </CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="font-medium text-space-emerald mb-2 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Net Outputs
              </h4>
              {balance.netOutputs.length > 0 ? (
                <ul className="space-y-1">
                  {balance.netOutputs.map((m, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-slate-300">{m.name}</span>
                      <span className="font-mono text-space-emerald">+{m.massKgPerDay.toFixed(1)} kg/day</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No net outputs</p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-space-amber mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Net Inputs (External)
              </h4>
              {balance.netInputs.length > 0 ? (
                <ul className="space-y-1">
                  {balance.netInputs.map((m, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-slate-300">{m.name}</span>
                      <span className="font-mono text-space-amber">{m.massKgPerDay.toFixed(1)} kg/day</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">Fully closed loop!</p>
              )}
            </div>
          </div>

          {/* Validation */}
          {!validation.valid && (
            <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-sm text-red-300">Validation errors: {validation.errors.join(", ")}</span>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${tone}-500/20 text-${tone}-400`}>{icon}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
          <span className="font-mono text-2xl text-white">{value}</span>
        </div>
      </CardBody>
    </Card>
  );
}