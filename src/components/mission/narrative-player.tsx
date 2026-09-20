"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Star, Flag, BookOpen, ArrowLeft, CheckCircle2, AlertCircle, Clock, Users, Rocket, Zap, Droplets, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { type NarrativeScenario, type NarrativeState, evaluateNarrativeState, createInitialNarrativeState, applyNarrativeChoice, getAvailableChoices } from "@/lib/narrative";
import { type DesignInput } from "@/lib/design-link";
import { designMission } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";
import { type MissionDesign } from "@/lib/mission";
import { useToast } from "@/components/ui/toast";

interface NarrativePlayerProps {
  scenario: NarrativeScenario;
  onBack?: () => void;
}

function ChoiceButton({ choice, onClick, disabled }: {
  choice: { id: string; text: string; consequence: string; designDelta?: Partial<DesignInput> };
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full text-left p-4 h-auto justify-start gap-3",
        "hover:bg-space-cyan/10 border-space-cyan/30",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex-1">
        <p className="font-medium text-white">{choice.text}</p>
        <p className="mt-1 text-xs text-slate-400 italic">{choice.consequence}</p>
        {choice.designDelta && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(choice.designDelta).map(([key, value]) => (
              <Badge key={key} tone="cyan" className="text-[10px]">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-space-cyan shrink-0" />
    </Button>
  );
}

function ProgressHeader({ scenario, state, evaluation }: {
  scenario: NarrativeScenario;
  state: NarrativeState;
  evaluation: ReturnType<typeof evaluateNarrativeState>;
}) {
  const progress = (state.visitedNodes.length / scenario.nodes.length) * 100;
  const completedStars = "★".repeat(evaluation.stars) + "☆".repeat(3 - evaluation.stars);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Badge tone={scenario.difficulty === "Advanced" ? "crimson" : scenario.difficulty === "Intermediate" ? "amber" : "emerald"} className="text-xs">
            {scenario.difficulty}
          </Badge>
          <Badge tone="cyan" className="ml-2 text-xs">{scenario.persona.toUpperCase()}</Badge>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg text-space-cyan">{completedStars}</p>
          <p className="text-xs text-slate-500">{evaluation.score} / {scenario.parScore} par</p>
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-space-cyan to-space-emerald transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500 text-right">
        Node {state.visitedNodes.length} of {scenario.nodes.length} · {state.flags.size} flags set
      </p>
    </div>
  );
}

function DesignSummary({ design }: { design: DesignInput }) {
  const missionDesign = designMission(design);

  return (
    <Card className="glass-panel mb-6">
      <CardBody className="p-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Rocket className="h-4 w-4 text-space-cyan" />
          Current Mission Design
        </CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Rocket className="h-3.5 w-3.5" />
            <span>{missionDesign.vehicle.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users className="h-3.5 w-3.5" />
            <span>{design.crew} crew</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{design.surfaceDays} surface days</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="h-3.5 w-3.5" />
            <span>{missionDesign.totalDeltaVKmS.toFixed(1)} km/s Δv</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function FlagDisplay({ flags }: { flags: Set<string> }) {
  if (flags.size === 0) return null;

  const flagLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    crop_potatoes: { label: "Potatoes Planted", icon: <Leaf className="h-3 w-3" />, color: "amber" },
    crop_soybeans: { label: "Soybeans Planted", icon: <Leaf className="h-3 w-3" />, color: "emerald" },
    crop_mixed: { label: "Mixed Rotation", icon: <Leaf className="h-3 w-3" />, color: "cyan" },
    wpa_repaired: { label: "WPA Repaired", icon: <Droplets className="h-3 w-3" />, color: "emerald" },
    crop_reduced: { label: "Crop Reduced", icon: <Leaf className="h-3 w-3" />, color: "amber" },
    ice_mining: { label: "Ice Mining Active", icon: <Droplets className="h-3 w-3" />, color: "cyan" },
    staggered: { label: "Staggered Planting", icon: <Clock className="h-3 w-3" />, color: "amber" },
    greens_cut: { label: "Greens Cut", icon: <Leaf className="h-3 w-3" />, color: "crimson" },
    harvest_success: { label: "Bumper Crop", icon: <CheckCircle2 className="h-3 w-3" />, color: "emerald" },
    harvest_partial: { label: "Partial Harvest", icon: <AlertCircle className="h-3 w-3" />, color: "amber" },
    harvest_failure: { label: "Crop Failure", icon: <AlertCircle className="h-3 w-3" />, color: "crimson" },
    rim_done: { label: "Rim Traverse", icon: <Flag className="h-3 w-3" />, color: "cyan" },
    shadow_done: { label: "Shadow Descent", icon: <Flag className="h-3 w-3" />, color: "amber" },
    volcanic_done: { label: "Volcanic Hunt", icon: <Flag className="h-3 w-3" />, color: "crimson" },
    anomaly_investigated: { label: "Thorium Anomaly", icon: <Zap className="h-3 w-3" />, color: "emerald" },
    plan_followed: { label: "Plan Followed", icon: <CheckCircle2 className="h-3 w-3" />, color: "cyan" },
    compromise: { label: "Compromise", icon: <Flag className="h-3 w-3" />, color: "amber" },
    ice_priority: { label: "Ice Core Priority", icon: <Droplets className="h-3 w-3" />, color: "cyan" },
    kreep_priority: { label: "KREEP Priority", icon: <Zap className="h-3 w-3" />, color: "amber" },
    balanced_suite: { label: "Balanced Suite", icon: <Flag className="h-3 w-3" />, color: "cyan" },
    ppe_first: { label: "PPE First", icon: <Zap className="h-3 w-3" />, color: "cyan" },
    halo_first: { label: "HALO First", icon: <Users className="h-3 w-3" />, color: "amber" },
    dual_manifest: { label: "Dual Manifest", icon: <Rocket className="h-3 w-3" />, color: "emerald" },
    esa_patch: { label: "ESA Patch", icon: <BookOpen className="h-3 w-3" />, color: "cyan" },
    csa_adapter: { label: "CSA Adapter", icon: <Flag className="h-3 w-3" />, color: "amber" },
    nasa_patch: { label: "NASA Crash Patch", icon: <AlertCircle className="h-3 w-3" />, color: "crimson" },
    water_upgraded: { label: "Water Upgrade", icon: <Droplets className="h-3 w-3" />, color: "emerald" },
    co2_fixed: { label: "CO2 Fixed", icon: <Zap className="h-3 w-3" />, color: "cyan" },
    both_minimal: { label: "Minimal Fixes", icon: <AlertCircle className="h-3 w-3" />, color: "amber" },
    science_first: { label: "Science Priority", icon: <BookOpen className="h-3 w-3" />, color: "emerald" },
    maintenance_first: { label: "Maintenance Priority", icon: <Flag className="h-3 w-3" />, color: "amber" },
    esprit_demo: { label: "ESPRIT Demo", icon: <Rocket className="h-3 w-3" />, color: "cyan" },
  };

  return (
    <Card className="glass-panel mb-6">
      <CardBody className="p-4">
        <CardTitle className="flex items-center gap-2 text-sm mb-3">
          <Flag className="h-4 w-4 text-space-cyan" />
          Narrative Flags ({flags.size})
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {Array.from(flags).map((flag) => {
            const info = flagLabels[flag] || { label: flag, icon: <Flag className="h-3 w-3" />, color: "slate" };
            return (
              <Badge key={flag} tone={info.color as any} className="gap-1">
                {info.icon}
                {info.label}
              </Badge>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function NarrativePlayer({ scenario, onBack }: NarrativePlayerProps) {
  const [state, setState] = useState<NarrativeState>(() => createInitialNarrativeState(scenario));
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const design = useMemo(() => designMission(state.design as DesignInput), [state.design]);
  const scorecard = useMemo(() => scoreMission(design), [design]);
  const evaluation = useMemo(() => evaluateNarrativeState(scenario, state, scorecard), [scenario, state, scorecard]);
  const currentNode = useMemo(() => scenario.nodes.find((n) => n.id === state.currentNodeId), [scenario.nodes, state.currentNodeId]);
  const availableChoices = useMemo(() => getAvailableChoices(scenario, state), [scenario, state]);
  const isEnding = currentNode?.isEnding ?? false;

  const handleChoice = async (choiceId: string) => {
    setSubmitting(true);
    try {
      setState((prev) => applyNarrativeChoice(scenario, prev, choiceId));
      toast({ type: "success", title: "Choice recorded", description: "Narrative advanced" });
    } catch (e) {
      toast({ type: "error", title: "Error", description: "Failed to apply choice" });
    }
    setSubmitting(false);
  };

  const handleRestart = () => {
    setState(createInitialNarrativeState(scenario));
    toast({ type: "info", title: "Restarted", description: "Narrative reset to beginning" });
  };

  if (!currentNode) return <div className="text-center py-12 text-slate-400">Loading narrative...</div>;

  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {onBack && (
          <Button variant="ghost" className="mb-6" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Missions
          </Button>
        )}

        <SectionHeading
          kicker={`NARRATIVE · ${scenario.persona.toUpperCase()}`}
          title={scenario.title}
          description={scenario.brief}
        />

        <ProgressHeader scenario={scenario} state={state} evaluation={evaluation} />

        <DesignSummary design={state.design as DesignInput} />

        <FlagDisplay flags={state.flags} />

        <Card className="glass-panel mb-6">
          <CardBody className="p-6">
            {currentNode.speaker && (
              <p className="font-mono text-xs text-space-cyan mb-2">{currentNode.speaker}</p>
            )}
            <p className="text-base leading-relaxed text-slate-300 whitespace-pre-line">{currentNode.narrative}</p>

            {isEnding && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-space-emerald/20 to-space-cyan/20 border border-space-emerald/30">
                <p className="font-mono text-xs text-space-emerald mb-2">
                  {evaluation.endingType === "success" ? "MISSION SUCCESS" :
                   evaluation.endingType === "partial" ? "MISSION PARTIAL" : "MISSION FAILURE"}
                </p>
                <p className="font-mono text-lg text-space-cyan">{evaluation.stars} / 3 Stars</p>
                <p className="mt-2 text-sm text-slate-300">
                  Final Score: {evaluation.score} · Par: {scenario.parScore}
                </p>
              </div>
            )}

            {!isEnding && availableChoices.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="font-mono text-xs text-space-cyan mb-3">CHOOSE YOUR PATH</p>
                {availableChoices.map((choice) => (
                  <ChoiceButton
                    key={choice.id}
                    choice={choice}
                    onClick={() => handleChoice(choice.id)}
                    disabled={submitting}
                  />
                ))}
              </div>
            )}

            {isEnding && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleRestart} variant="outline">
                  <ChevronRight className="h-4 w-4 mr-2" /> Play Again
                </Button>
                <Button onClick={onBack} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Missions
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {!isEnding && (
          <Card className="glass-panel">
            <CardBody className="p-4">
              <CardTitle className="flex items-center gap-2 text-sm mb-3">
                <BookOpen className="h-4 w-4 text-space-cyan" />
                Mission Log
              </CardTitle>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {state.history.slice(-10).map((entry, i) => (
                  <div key={i} className="text-xs text-slate-400 border-l border-white/10 pl-3">
                    <p className="font-mono text-space-cyan">{scenario.nodes.find(n => n.id === entry.nodeId)?.speaker || "SYSTEM"}</p>
                    <p>{scenario.nodes.find(n => n.id === entry.nodeId)?.choices.find(c => c.id === entry.choiceId)?.text || entry.choiceId}</p>
                  </div>
                ))}
                {state.history.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No choices made yet. Your story begins now.</p>
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}