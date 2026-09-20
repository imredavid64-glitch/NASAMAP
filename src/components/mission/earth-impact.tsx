"use client";

import { useMemo } from "react";
import { Globe, Droplets, Leaf, Home, Zap, Shield, Users, BookOpen, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

interface EarthImpactProps {
  design: any;
  ops: any;
}

const SPILLOVER_CARDS = [
  {
    id: "water",
    title: "Water Security for Arid Regions",
    icon: Droplets,
    accent: "linear-gradient(135deg,#06b6d4,#0891b2)",
    metric: "90% recycling → municipal scale",
    detail: "ISS Water Recovery System tech (90% recovery) is now deployed in water-stressed regions globally. Your mission's closed-loop budget proves the same physics works at any scale.",
    earthImpact: "Direct spinoff: ECLSS water tech → Namibia, UAE, Singapore, ISS-derived systems purify 2M+ gallons/day on Earth.",
    confidence: "documented",
    nasaRef: "NASA Spinoff 2022: Water Recovery Technology",
  },
  {
    id: "energy",
    title: "Off-Grid Solar + Storage Optimization",
    icon: Zap,
    accent: "linear-gradient(135deg,#f59e0b,#fbbf24)",
    metric: "Array sizing from first principles",
    detail: "The same inverse-square law calculation that sizes your Mars array (1.361 kW/m² ÷ 1.52² AU) optimizes solar+battery for remote clinics, telecom towers, and microgrids.",
    earthImpact: "NASA's ISS array tech (30% multi-junction) → terrestrial concentrator PV. Your array area calc = any off-grid load sizing.",
    confidence: "derived",
    nasaRef: "NASA Glenn Research Center: PV Array Design Tools",
  },
  {
    id: "food",
    title: "Controlled Environment Agriculture",
    icon: Leaf,
    accent: "linear-gradient(135deg,#22c55e,#16a34a)",
    metric: "0.62 kg/person/day food mass",
    detail: "Space crop research (Veggie, APH on ISS) drives vertical farming LED recipes, nutrient delivery, and automation. Your consumables budget = indoor farm input model.",
    earthImpact: "ISS Veggie → Plenty, AeroFarms, Bowery. Space-tested LED spectra cut energy 40% vs legacy greenhouse lighting.",
    confidence: "documented",
    nasaRef: "NASA Kennedy: Veggie/APH Plant Growth Systems",
  },
  {
    id: "radiation",
    title: "Radiation Protection for Workers & Patients",
    icon: Shield,
    accent: "linear-gradient(135deg,#ef4444,#dc2626)",
    metric: "600 mSv career limit model",
    detail: "NSCR-2020 cancer risk model (used for your crew dose) also protects nuclear workers, airline crews, and radiotherapy patients. GCR/SPE models → terrestrial shielding standards.",
    earthImpact: "NSCR model → ICRP occupational limits, FAA aircrew monitoring, proton therapy QA. Your dose calc shares the same physics.",
    confidence: "documented",
    nasaRef: "NASA Space Cancer Risk 2020 (NSCR-2020)",
  },
  {
    id: "health",
    title: "Aging & Immobility Countermeasures",
    icon: Users,
    accent: "linear-gradient(135deg,#a855f7,#9333ea)",
    metric: "1.5%/month bone loss → exercise Rx",
    detail: "ARED resistive exercise protocol (bone loss mitigation on ISS) directly informs osteoporosis rehab, ICU early mobilization, and sarcopenia prevention in aging populations.",
    earthImpact: "ARED protocol → clinical guidelines for bedrest deconditioning, spaceflight analog bedrest studies (NASA/ESA :envihab).",
    confidence: "documented",
    nasaRef: "NASA HRP: Advanced Resistive Exercise Device (ARED)",
  },
  {
    id: "comm",
    title: "Remote Operations & Telemedicine",
    icon: Globe,
    accent: "linear-gradient(135deg,#ec4899,#db2777)",
    metric: "25 min round-trip → autonomy design",
    detail: "Light-lag operations (your comms window) drive telerobotics, tele-surgery, and autonomous systems for disaster response, deep-sea, and rural healthcare.",
    earthImpact: "DSN comms architecture → Mars rover ops → surgical robotics (da Vinci), offshore teleoperation, Arctic telemedicine.",
    confidence: "derived",
    nasaRef: "NASA Human Research Program: Communication Delay Research",
  },
] as const;

export function EarthImpact({ design, ops }: EarthImpactProps) {
  const relevant = useMemo(() => {
    return SPILLOVER_CARDS.filter((c) => {
      if (c.id === "water" && ops.savedPct > 0) return true;
      if (c.id === "energy" && ops.arrayAreaM2 > 0) return true;
      if (c.id === "food" && design.consumables.foodKg > 0) return true;
      if (c.id === "radiation" && design.radiationMsvTotal > 0) return true;
      if (c.id === "health" && design.totalDays > 30) return true;
      if (c.id === "comm" && design.arrivalLt.oneWaySec > 10) return true;
      return false;
    });
  }, [design, ops]);

  if (relevant.length === 0) return null;

  return (
    <section id="earth-impact" className="scroll-mt-20">
      <SectionHeading
        kicker="Act III · EARTH"
        title="Why This Mission Matters on Earth"
        description="Every capability you just designed has a terrestrial spinoff. NASA invests in space to solve problems here."
      />
      <p className="mt-3 max-w-4xl text-slate-400">
        The physics engine you just used — closed-loop water, inverse-square solar sizing, radiation risk models, bone-loss countermeasures,
        light-lag autonomy — isn't theoretical. Each line item below traces from your mission numbers to a deployed Earth application.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relevant.map((card) => (
          <Card
            key={card.id}
            className={cn(
              "relative overflow-hidden transition hover:border-space-cyan/40",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:to-white/5 before:opacity-0 hover:before:opacity-100"
            )}
          >
            <CardBody>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: card.accent }}
                >
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                  <p className="mt-1 font-mono text-xs text-space-cyan">{card.metric}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">{card.detail}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge tone={card.confidence === "documented" ? "emerald" : "cyan"} className="text-[10px]">
                  {card.confidence}
                </Badge>
                <a
                  href="#"
                  className="text-[10px] text-space-cyan hover:underline font-mono flex items-center gap-1"
                  title={card.nasaRef}
                >
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  NASA Ref
                </a>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[11px] text-slate-500 italic">
                  <span className="text-space-emerald font-medium">Earth impact:</span> {card.earthImpact}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-space-cyan/30 bg-space-cyan/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <BookOpen className="h-4 w-4 text-space-cyan" />
          Classroom Connection
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Each spinoff card maps to NGSS/STEM standards. Teachers: use the Mission Lab as a systems engineering case study.
        </p>
        <ul className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
          <li>• <span className="font-mono text-space-cyan">HS-ETS1-1</span> — Define criteria/constraints (mission brief → design params)</li>
          <li>• <span className="font-mono text-space-cyan">HS-ETS1-2</span> — Decompose complex problem (Δv + radiation + ECLSS + budget)</li>
          <li>• <span className="font-mono text-space-cyan">HS-ESS3-4</span> — Tech solutions for human impacts (ECLSS → water security)</li>
          <li>• <span className="font-mono text-space-cyan">HS-PS3-3</span> — Energy conversion design (solar array sizing from load)</li>
          <li>• <span className="font-mono text-space-cyan">HS-LS1-3</span> — Homeostasis feedback (bone/muscle countermeasures)</li>
          <li>• <span className="font-mono text-space-cyan">HS-PS4-2</span> — Wave comms & digital transmission (light-lag ops)</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Printable worksheet + teacher guide:{" "}
          <a href="/library/space-mission-design-classroom" className="text-space-cyan hover:underline font-mono">
            /library/space-mission-design-classroom
          </a>
        </p>
      </div>
    </section>
  );
}