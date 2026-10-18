"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpaceCanvas } from "@/components/space-canvas";

interface JudgeTourContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const JudgeTourContext = createContext<JudgeTourContextType | null>(null);

export function useJudgeTour() {
  const context = useContext(JudgeTourContext);
  if (!context) {
    throw new Error("useJudgeTour must be used within a JudgeTourProvider");
  }
  return context;
}

interface JudgeTourProviderProps {
  children: ReactNode;
  autoStart?: boolean;
}

const TOUR_STEPS = [
  {
    title: "Welcome to NASAMAP",
    description: "This guided tour walks you through the submission in ~8 minutes. Each step highlights a key capability with links to live features.",
    highlight: null,
  },
  {
    title: "Play & Plan — Mission Design Game",
    description: "Six mission briefs with hard constraints (vehicle, crew, surface days, radiation), 0–3 star grading, par scores, and local progress persistence. Try the Artemis Crewed Landing brief.",
    highlight: "play",
  },
  {
    title: "Mission Lab — Free Design",
    description: "Pick any destination, vehicle, crew size, and surface stay. The engine computes Δv, mass budget, radiation dose, comms lag, and closed-loop ECLSS — then rates it S–D with GO/NO-GO gate.",
    highlight: "mission",
  },
  {
    title: "Fly — Trajectory Replay & Solvers",
    description: "Apollo 11 event-by-event replay, patched-conic Moon transfer, Kepler Earth→Mars solve. All trajectories export to CSV.",
    highlight: "fly",
  },
  {
    title: "Live — Real-Time Space Data",
    description: "ISS ground track with KML export for Google Earth, Voyager range from JPL Horizons, APOD, NEO feed, space weather — all with committed snapshot fallbacks.",
    highlight: "live",
  },
  {
    title: "Tools — Advanced Capabilities",
    description: "Rocket Builder (12 engines, 15 tanks), Mission Optimizer (NSGA-II Pareto fronts), ISRU Designer, Porkchop plots, Monte Carlo uncertainty analysis.",
    highlight: "tools",
  },
  {
    title: "Challenge Aligner — 42/86 Served",
    description: "Every official Space Apps 2026 challenge mapped to shipped capabilities via regex lanes. Each badge deep-links to the feature that does the work.",
    highlight: "challenges",
  },
  {
    title: "Engineering Evidence",
    description: "250 unit tests pin every number to NASA/CODATA references. Git-as-database with validated schemas. Zero secrets, offline-first PWA, CI/CD pipeline.",
    highlight: null,
  },
];

export function JudgeTourProvider({ children, autoStart = false }: JudgeTourProviderProps) {
  const [isOpen, setIsOpen] = useState(autoStart);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (autoStart) {
      setIsOpen(true);
      setCurrentStep(0);
    }
  }, [autoStart]);

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const closeTour = () => setIsOpen(false);

  return (
    <JudgeTourContext.Provider value={{ isOpen, setIsOpen, currentStep, setCurrentStep }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-space-950">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20">
                  <svg className="h-5 w-5 text-space-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-white">Judge Tour</h2>
                  <p className="text-xs text-slate-400">Step {currentStep + 1} of {TOUR_STEPS.length}</p>
                </div>
              </div>
              <button onClick={closeTour} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-space-cyan to-space-emerald transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>

              <div className="space-y-4">
                {TOUR_STEPS[currentStep].highlight && (
                  <Badge tone="cyan" className="inline-block mb-2">
                    Go to: /{TOUR_STEPS[currentStep].highlight}
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-white">{TOUR_STEPS[currentStep].title}</h3>
                <p className="text-slate-400">{TOUR_STEPS[currentStep].description}</p>
              </div>

              {currentStep === 1 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 h-64 w-full">
                  <SpaceCanvas bodyId="earth" cameraDistance={2.8} />
                </div>
              )}

              {currentStep === 2 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 h-64 w-full">
                  <SpaceCanvas bodyId="mars" cameraDistance={2.8} />
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="text-sm text-slate-400">
                  {currentStep + 1} / {TOUR_STEPS.length}
                </div>
                <Button
                  onClick={nextStep}
                  disabled={currentStep === TOUR_STEPS.length - 1}
                  className="flex items-center gap-2 ml-auto"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </JudgeTourContext.Provider>
  );
}