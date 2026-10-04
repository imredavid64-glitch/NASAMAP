"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createContext, useContext, ReactNode } from "react";
import { X, Play, Pause, ChevronRight, ChevronLeft, Info, AlertCircle, Volume2, VolumeX, FastForward, SkipBack, SkipForward, Menu } from "lucide-react";
import { cn } from "@/lib/cn";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  route: string;
  duration: number; // seconds
  narration: string;
  narrationAudio?: string; // Optional pre-recorded audio URL
  action?: () => void;
}

type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

interface JudgeTourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  playbackSpeed: PlaybackSpeed;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  narrationEnabled: boolean;
  toggleNarration: () => void;
  showControls: boolean;
  toggleControls: () => void;
  showKeyboardHelp: boolean;
  toggleKeyboardHelp: () => void;
}

const JudgeTourContext = createContext<JudgeTourContextType | null>(null);

export function useJudgeTour() {
  const ctx = useContext(JudgeTourContext);
  if (!ctx) throw new Error("useJudgeTour must be used within JudgeTourProvider");
  return ctx;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "landing",
    title: "Landing Page",
    description: "Entry point â€” every human has a seat at the frontier",
    route: "/",
    duration: 8,
    narration: "NASAMAP turns real Moon-to-Mars mission design into a playable, physics-driven loop. No database, no secrets, fully offline-capable.",
  },
  {
    id: "play",
    title: "Play & Plan â€” Mission Briefs",
    description: "Six scenario briefs with hard constraints, 0â€“3 star grading",
    targetSelector: "[href='/play']",
    route: "/play",
    duration: 15,
    narration: "Six mission briefs â€” Artemis lunar landing, Mars surface stay, etc. Each has hard constraints: vehicle, crew, surface time, radiation. The engine scores objectives in real time. Beat par for stars.",
    action: () => {
      const card = document.querySelector("[href='/play/artemis-crewed-landing']") as HTMLElement;
      card?.click();
    },
  },
  {
    id: "scenario",
    title: "Scenario Game â€” Live Scoring",
    description: "Adjust sliders â†’ watch Sâ€“D grade update â†’ earn stars â†’ download Report Card",
    targetSelector: "input[type='range']",
    route: "/play/artemis-crewed-landing",
    duration: 20,
    narration: "Drag crew, surface days, vehicle â€” the scorecard recalculates live across 7 weighted objectives. Feasibility caps: an unliftable stack or over-limit dose can never rate S. Hit 3 stars, download the Report Card SVG â€” it carries the grade, numbers, and permalink.",
  },
  {
    id: "mission",
    title: "Mission Lab â€” Free Design",
    description: "Build any mission; permalink encodes exact design; personal best per destination",
    route: "/mission",
    duration: 15,
    narration: "Free-form Mission Lab. Every slider change rewrites the URL â€” your exact stack is a shareable, reproducible citation. Personal best per destination saved locally. Switch to Guide mode for coaching hints.",
  },
  {
    id: "fly",
    title: "Fly â€” Trajectory Replay & Export",
    description: "Apollo 11 replay, patched-conic Moon, Kepler Mars â€” all export CSV",
    route: "/fly",
    duration: 12,
    narration: "Three modes: Apollo 11 event-by-event from historical timeline, patched-conic Hohmann to Moon, Sun-centered Kepler solve for Mars. Every trajectory exports full path to CSV for analysis.",
  },
  {
    id: "live",
    title: "Live â€” Real-Time Space Data",
    description: "ISS ground track + KML, Voyager range, APOD, NEO, space weather â€” snapshot fallback",
    route: "/live",
    duration: 15,
    narration: "ISS pass prediction via SGP4 (satellite.js), ground track exports to KML for Google Earth. Voyager 1 & 2 range from JPL Horizons. APOD, NEO, NOAA SWPC â€” every feed has a committed snapshot fallback so the demo never dies on stage.",
  },
  {
    id: "commons",
    title: "Cosmic Data Commons",
    description: "Library, personas, search, passport, patch, challenge aligner (37/86)",
    route: "/commons",
    duration: 12,
    narration: "Curated articles, persona advice cards (farmer on Mars, etc.), MiniSearch full-text index. Mission Passport & Patch generated deterministically from the design. Challenge Aligner maps 37 of 86 official 2026 challenges to shipped capabilities â€” each badge deep-links to the feature.",
  },
  {
    id: "engine",
    title: "The Science Engine",
    description: "18 pure modules, 234 tests, every number sourced â€” Kepler, SGP4, ECLSS, radiation",
    route: "/",
    duration: 10,
    narration: "Under the hood: 18 pure TypeScript modules, 234 Vitest tests. Kepler solvers, Hohmann patched-conic, ISS-class ECLSS (90% water, 50% Oâ‚‚ recovery), MSL RAD radiation, NASA-STD-3001 dose limits. Every constant cited: CODATA, IAU, NASA fact sheets. Engineering honesty: every number tagged documented, derived, or estimate.",
  },
];

export function JudgeTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [showControls, setShowControls] = useState(true);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stepStartTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Text-to-speech narration
  const speakNarration = useCallback((text: string) => {
    if (!narrationEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [narrationEnabled, playbackSpeed]);

  const stopNarration = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  // Keyboard shortcuts for judge demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Tour navigation shortcuts (1-5 keys)
      if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const stepIndex = parseInt(e.key, 10) - 1;
        const routes = ["/play", "/mission", "/fly", "/live", "/challenges"];
        if (routes[stepIndex]) {
          window.location.href = routes[stepIndex];
        }
      }
      
      // Tour control shortcuts
      if (e.key === " " && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        togglePlay();
      }
      
      if (e.key === "ArrowRight" && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        nextStep();
      }
      
      if (e.key === "ArrowLeft" && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        prevStep();
      }
      
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setPlaybackSpeed((prev) => {
          const speeds: PlaybackSpeed[] = [0.5, 1, 1.5, 2];
          const idx = speeds.indexOf(playbackSpeed);
          return speeds[Math.min(idx + 1, speeds.length - 1)];
        });
      }
      
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setPlaybackSpeed((prev) => {
          const speeds: PlaybackSpeed[] = [0.5, 1, 1.5, 2];
          const idx = speeds.indexOf(playbackSpeed);
          return speeds[Math.max(idx - 1, 0)];
        });
      }
      
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setNarrationEnabled((prev) => !prev);
      }
      
      if (e.key === "h" || e.key === "H" || e.key === "?") {
        e.preventDefault();
        // Keyboard shortcuts help is now in a separate component
      }
      
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setShowControls((prev) => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playbackSpeed]);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "judge") {
      setIsActive(true);
      // Start at step 1 (skip landing page auto-nav)
      setCurrentStep(1);
      setIsPlaying(true);
    }
  }, []);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
    setCurrentStep(0);
    stopNarration();
    // Remove tour param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(Math.max(0, Math.min(index, TOUR_STEPS.length - 1)));
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Speak narration when step changes
  useEffect(() => {
    if (isActive && isPlaying) {
      const step = TOUR_STEPS[currentStep];
      if (step.narration) {
        // Small delay to let page transition complete
        const timer = setTimeout(() => {
          speakNarration(step.narration);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, isPlaying, isActive]);

  // Auto-advance when playing
  useEffect(() => {
    if (!isActive || !isPlaying || currentStep >= TOUR_STEPS.length - 1) return;
    const step = TOUR_STEPS[currentStep];
    const adjustedDuration = step.duration / playbackSpeed;
    const timer = setTimeout(() => {
      nextStep();
    }, adjustedDuration * 1000);
    return () => clearTimeout(timer);
  }, [isActive, isPlaying, currentStep, nextStep, playbackSpeed]);

  // Progress bar animation
  useEffect(() => {
    if (!isActive || !isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }
    
    stepStartTimeRef.current = Date.now();
    const step = TOUR_STEPS[currentStep];
    const adjustedDuration = step.duration / playbackSpeed;
    
    progressIntervalRef.current = setInterval(() => {
      // Force re-render for progress bar
    }, 100);
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isActive, isPlaying, currentStep, playbackSpeed]);

// Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNarration();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
  }, []);

  const toggleNarration = useCallback(() => {
    setNarrationEnabled((prev) => !prev);
    if (!narrationEnabled) {
      // If enabling, speak current step
      if (isActive) {
        const step = TOUR_STEPS[currentStep];
        if (step.narration) {
          setTimeout(() => speakNarration(step.narration), 100);
        }
      }
    } else {
      stopNarration();
    }
  }, [narrationEnabled, isActive, currentStep, speakNarration, stopNarration]);

const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const toggleKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <JudgeTourContext.Provider
      value={{
        isActive,
        currentStep,
        steps: TOUR_STEPS,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        goToStep,
        isPlaying,
        togglePlay,
        playbackSpeed,
        setPlaybackSpeed,
        narrationEnabled,
        toggleNarration,
        showControls,
        toggleControls,
        showKeyboardHelp,
        toggleKeyboardHelp,
      }}
    >
      {children}
      {isActive && <JudgeTourOverlay />}
    </JudgeTourContext.Provider>
  );
}

function JudgeTourOverlay() {
  const { 
    currentStep, 
    steps, 
    isPlaying, 
    nextStep, 
    prevStep, 
    goToStep, 
    stopTour, 
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    narrationEnabled,
    toggleNarration,
    showControls,
    toggleControls,
    showKeyboardHelp,
    toggleKeyboardHelp,
  } = useJudgeTour();
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const speeds: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-live="polite">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-space-950/80 backdrop-blur">
        <div
          className="h-full bg-gradient-to-r from-space-cyan to-space-emerald transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tour control panel */}
      <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
        <div className="glass-panel rounded-2xl border border-white/10 bg-space-950/80 backdrop-blur p-4 max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-space-cyan">
                  Step {currentStep + 1} / {steps.length}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-space-cyan/20 text-space-cyan">
                  {step.id.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm">{step.title}</h3>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">{step.description}</p>
              <p className="mt-2 text-[11px] text-slate-500 italic max-h-16 overflow-hidden">
                đźŽ™ď¸Ź {step.narration}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn(
                  "p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed",
                  "hover:bg-white/10 text-slate-300 hover:text-white"
                )}
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={togglePlay}
                className={cn(
                  "p-2 rounded-lg transition",
                  "hover:bg-white/10 text-slate-300 hover:text-white"
                )}
                aria-label={isPlaying ? "Pause narration" : "Play narration"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className={cn(
                  "p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed",
                  "hover:bg-white/10 text-slate-300 hover:text-white"
                )}
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={stopTour}
                className="p-2 rounded-lg transition hover:bg-white/10 text-slate-400 hover:text-white"
                aria-label="Exit tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Playback controls */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            {/* Playback speed */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Speed:</span>
              <div className="flex items-center gap-1">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-medium transition",
                      playbackSpeed === speed
                        ? "bg-space-cyan text-space-950"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
            </div>

            {/* Narration toggle */}
            <button
              onClick={toggleNarration}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition",
                narrationEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
              )}
              aria-label={narrationEnabled ? "Disable narration" : "Enable narration"}
            >
              {narrationEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Narration</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Muted</span>
                </>
              )}
            </button>

            {/* Keyboard help toggle */}
            <button
              onClick={toggleKeyboardHelp}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition",
                showKeyboardHelp
                  ? "bg-space-cyan/20 text-space-cyan border border-space-cyan/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
              )}
              aria-label={showKeyboardHelp ? "Hide keyboard shortcuts" : "Show keyboard shortcuts"}
            >
              <Info className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">{showKeyboardHelp ? "Hide" : "Show"} Shortcuts</span>
            </button>

            {/* Controls visibility toggle */}
            <button
              onClick={toggleControls}
              className="p-2 rounded-lg transition hover:bg-white/10 text-slate-400 hover:text-white"
              aria-label={showControls ? "Hide controls" : "Show controls"}
            >
              {showControls ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>// Close JSX expression

        {/* Step indicators */}
        <div className="mt-3 flex items-center justify-center gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={cn(
                "h-1.5 rounded transition",
                i === currentStep
                  ? "w-6 bg-space-cyan"
                  : "w-3 bg-white/10 hover:bg-white/20"
              )}
              aria-label={"Go to step " + (i + 1)}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Target highlight */}
    {step.targetSelector && (
      <TargetHighlight selector={step.targetSelector} />
    )}
  </div>
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
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [selector]);

  if (!targetRect) return null;

  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{
        top: targetRect.top - 4,
        left: targetRect.left - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
      }}
    >
      <div className="absolute inset-0 rounded-lg border-2 border-space-cyan/60 bg-space-cyan/10 animate-pulse" />
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded bg-space-cyan px-2 py-0.5 text-[10px] font-medium text-white"
      >
        <Info className="h-3 w-3" />
        TOUR FOCUS
      </div>
    </div>
  );
}



