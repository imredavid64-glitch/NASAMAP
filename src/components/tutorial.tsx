"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info, Target, Lightbulb, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Scenario } from "@/lib/scenarios";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  action?: () => void;
  validation?: () => boolean;
  hint?: string;
}

const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  "artemis-crewed-landing": [
    {
      id: "welcome",
      title: "Welcome to Artemis: Crewed Lunar Landing",
      description: "This scenario challenges you to land a crew on the Moon using SLS Block 1 or Saturn V, with 2-4 crew and 3-14 surface days, while staying under 600 mSv radiation.",
      hint: "Click Next to start the tutorial.",
    },
    {
      id: "destination",
      title: "Select Destination",
      description: "This scenario is fixed to the Moon. In free Mission Lab you could choose Mars too.",
      targetSelector: "button[role='radio']:has-text('Moon')",
      hint: "Notice the destination is locked for this mission brief.",
    },
    {
      id: "vehicle",
      title: "Choose Launch Vehicle",
      description: "Only SLS Block 1 and Saturn V are allowed for this scenario. Each has different TLI payload capacity.",
      targetSelector: "select",
      validation: () => true,
      hint: "Try both vehicles and watch the Launch Gate change.",
    },
    {
      id: "crew",
      title: "Set Crew Size",
      description: "Adjust crew between 2-4. More crew increases consumables and radiation exposure but enables more surface work.",
      targetSelector: "input[id='crew-slider']",
      hint: "Drag the slider and watch the score update in real time.",
    },
    {
      id: "surface",
      title: "Set Surface Days",
      description: "Choose 3-14 days on the lunar surface. Longer stays need more consumables and increase radiation dose.",
      targetSelector: "input[id='surface-slider']",
      validation: () => true,
      hint: "Try 7 days for a balanced mission.",
    },
    {
      id: "score",
      title: "Watch the Score",
      description: "The scorecard shows 7 weighted objectives. Beat par (78) for 3 stars. The grade caps at S if all gates pass.",
      targetSelector: "#scorecard",
      hint: "Green = passing, Red = failing. Feasibility caps can prevent an S grade.",
    },
    {
      id: "launch",
      title: "Launch Mission",
      description: "Click Launch Mission to record your attempt. Your best score per destination is saved locally.",
      targetSelector: "button:has-text('Launch Mission')",
      action: () => {},
      hint: "Try to earn 3 stars!",
    },
    {
      id: "report",
      title: "Download Report Card",
      description: "The SVG report card carries your grade, all engine numbers, and a permalink to this exact design.",
      targetSelector: "button:has-text('Download SVG')",
      hint: "Share it with friends or submit as evidence.",
    },
  ],
  "first-boots-on-mars": [
    {
      id: "welcome",
      title: "First Boots on Mars",
      description: "The headline mission: get humans to Mars and back inside the radiation career limit. Starship or Falcon Heavy, 4-6 crew, 30-120 surface days.",
      hint: "Click Next to begin.",
    },
    {
      id: "vehicle",
      title: "Vehicle Choice Matters",
      description: "Starship (150t LEO) vs Falcon Heavy (64t LEO). The choice drastically changes what mass you can deliver to Mars.",
      targetSelector: "select",
      hint: "Try both and compare stack mass vs payload capacity.",
    },
    {
      id: "radiation",
      title: "Radiation is the Hard Constraint",
      description: "Transit + surface dose must stay under 600 mSv. Longer surface stays and slower transits increase dose.",
      targetSelector: "input[id='surface-slider']",
      hint: "Watch radiation dose as you adjust surface days and transit time.",
    },
    {
      id: "duration",
      title: "Total Mission Duration",
      description: "Keep total mission under 900 days. Fast transfers cost more Δv but reduce radiation exposure.",
      targetSelector: "#scorecard",
      hint: "Check the Duration objective in the scorecard.",
    },
    {
      id: "launch",
      title: "Launch and Iterate",
      description: "Adjust sliders until all objectives pass and grade is S. Then launch!",
      targetSelector: "button:has-text('Launch Mission')",
      hint: "The permalink in the URL captures your exact design.",
    },
  ],
  "recycling-on-mars": [
    {
      id: "welcome",
      title: "Recycling on Mars",
      description: "Push closed-loop life support to the limit. 4-6 crew, 30-365 surface days. ECLSS loop and ISRU waste processing are key.",
      hint: "Click Next.",
    },
    {
      id: "eclss",
      title: "ECLSS Closed Loop",
      description: "ISS recycles ~90% water and ~50% oxygen via Sabatier. The rest must be carried or made from ISRU.",
      targetSelector: "#budget",
      hint: "Check the Ops Budget panel for recycling rates.",
    },
    {
      id: "isru",
      title: "ISRU Waste Processing",
      description: "OSCAR thermal decomposition recovers water, oxygen, and fertilizer from crew waste. New in this version!",
      targetSelector: "section:has-text('ISRU Waste')",
      hint: "See the ISRU Waste-to-Resource card in the Ops section.",
    },
    {
      id: "launch",
      title: "Optimize for Max Loop Closure",
      description: "Maximize recycling + ISRU to minimize resupply mass. Then launch!",
      targetSelector: "button:has-text('Launch Mission')",
      hint: "Watch the 'mass saved' percentage climb.",
    },
  ],
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const steps = scenarioId ? TUTORIAL_STEPS[scenarioId] || [] : [];

  const startTutorial = useCallback((id: string) => {
    setScenarioId(id);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  // Listen for custom event from the page
  useEffect(() => {
    const handleStartTutorial = (e: CustomEvent) => {
      startTutorial(e.detail);
    };
    window.addEventListener("start-tutorial", handleStartTutorial as EventListener);
    return () => window.removeEventListener("start-tutorial", handleStartTutorial as EventListener);
  }, [startTutorial]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(prev => new Set(prev).add(scenarioId || ""));
      setIsActive(false);
      setScenarioId(null);
      setCurrentStep(0);
    }
  }, [currentStep, steps.length, scenarioId]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setScenarioId(null);
    setCurrentStep(0);
  }, []);

  if (!isActive || steps.length === 0) {
    return <>{children}</>;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-space-950/80 backdrop-blur">
          <div className="h-full bg-gradient-to-r from-space-cyan to-space-emerald transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-panel rounded-2xl border border-white/10 bg-space-950/90 backdrop-blur p-4 max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-space-cyan">Step {currentStep + 1} / {steps.length}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-space-cyan/20 text-space-cyan">TUTORIAL</span>
                </div>
                <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{step.description}</p>
                {step.hint && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 bg-space-cyan/10 rounded-lg p-2">
                    <Lightbulb className="h-3.5 w-3.5 text-space-cyan shrink-0" />
                    <span>{step.hint}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={cn("p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed", "hover:bg-white/10 text-slate-300 hover:text-white")}
                  aria-label="Previous step"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextStep}
                  className={cn("p-2 rounded-lg transition bg-space-cyan text-space-950 hover:bg-space-cyan/90")}
                  aria-label={currentStep === steps.length - 1 ? "Finish tutorial" : "Next step"}
                >
                  {currentStep === steps.length - 1 ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button
                  onClick={skipTutorial}
                  className="p-2 rounded-lg transition hover:bg-white/10 text-slate-400 hover:text-white"
                  aria-label="Exit tutorial"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "h-1.5 rounded transition",
                    i === currentStep ? "w-6 bg-space-cyan" : "w-3 bg-white/10 hover:bg-white/20"
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {step.targetSelector && (
          <TargetHighlight selector={step.targetSelector} />
        )}
      </div>
    </>
  );
}

function TargetHighlight({ selector }: { selector: string }) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(selector);
      if (el) setTargetRect(el.getBoundingClientRect());
      else setTargetRect(null);
    };
    update();
    const ro = new ResizeObserver(update);
    const el = document.querySelector(selector);
    if (el) ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => { ro.disconnect(); window.removeEventListener("scroll", update); };
  }, [selector]);

  if (!targetRect) return null;

  return (
    <div className="pointer-events-none fixed z-40" style={{ top: targetRect.top - 4, left: targetRect.left - 4, width: targetRect.width + 8, height: targetRect.height + 8 }}>
      <div className="absolute inset-0 rounded-lg border-2 border-space-cyan/60 bg-space-cyan/10 animate-pulse" />
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded bg-space-cyan px-2 py-0.5 text-[10px] font-medium text-white">
        <Target className="h-3 w-3" /> TUTORIAL FOCUS
      </div>
    </div>
  );
}

export function useTutorial() {
  // This would be provided by TutorialProvider context in a real implementation
  return { startTutorial: (id: string) => {} };
}

export { TUTORIAL_STEPS };