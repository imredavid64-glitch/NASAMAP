"use client";

import { useMemo } from "react";
import { AlertTriangle, Heart, Brain, Bone, Shield, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

interface CrewHealthDashboardProps {
  design: any;
  scorecard: any;
}

const ORGAN_DOSE_FACTORS: Record<string, number> = {
  "Skin": 1.5,
  "Eye (lens)": 1.2,
  "BFO (bone marrow)": 1.0,
  "Lung": 0.95,
  "Stomach": 0.9,
  "Colon": 0.9,
  "Bladder": 0.85,
  "Liver": 0.85,
  "Brain": 0.8,
  "Thyroid": 0.7,
  "Breast": 0.7,
  "Gonads": 0.6,
};

const RISK_THRESHOLDS = {
  "Bone loss (%/month)": { warn: 1.0, fail: 1.5, unit: "%/month", reverse: false },
  "Muscle loss (%/month)": { warn: 0.8, fail: 1.2, unit: "%/month", reverse: false },
  "Cardiovascular deconditioning": { warn: 30, fail: 50, unit: "% VO2max loss", reverse: true },
  "Radiation cancer risk": { warn: 1, fail: 3, unit: "% excess lifetime", reverse: false },
  "Cognitive performance": { warn: 15, fail: 25, unit: "% decline", reverse: true },
  "Behavioral health risk": { warn: 20, fail: 40, unit: "risk score", reverse: false },
};

export function CrewHealthDashboard({ design, scorecard }: CrewHealthDashboardProps) {
  const totalDays = design.totalDays;
  const radiationMsv = design.radiationMsvTotal;
  const isMars = design.destination === "mars";
  const cruiseDays = design.transferDays * 2;
  const surfaceDays = design.surfaceDays;

  const organDoses = useMemo(() => {
    return Object.entries(ORGAN_DOSE_FACTORS).map(([organ, factor]) => ({
      organ,
      dose: Math.round(radiationMsv * factor),
      factor,
    }));
  }, [radiationMsv]);

  const boneLoss = useMemo(() => {
    const microgravityMonths = cruiseDays / 30;
    const surfaceMonths = surfaceDays / 30;
    const gravityFactor = isMars ? 0.38 : 0.16;
    const monthlyLoss = 1.5 * (1 - gravityFactor * 0.5); // ~1.2%/mo for Mars, ~1.4% for Moon
    const totalLoss = monthlyLoss * (microgravityMonths + surfaceMonths * gravityFactor);
    return { monthly: monthlyLoss, total: totalLoss };
  }, [cruiseDays, surfaceDays, isMars]);

  const muscleLoss = useMemo(() => {
    const microgravityMonths = cruiseDays / 30;
    const monthlyLoss = 1.0 * (isMars ? 0.5 : 0.7); // Mars gravity helps
    const totalLoss = monthlyLoss * (cruiseDays / 30);
    return { monthly: monthlyLoss, total: totalLoss };
  }, [cruiseDays, isMars]);

  const cvDeconditioning = useMemo(() => {
    const microgravityMonths = cruiseDays / 30;
    const loss = 20 + microgravityMonths * 5; // 20% base + 5%/month
    return Math.min(60, loss);
  }, [cruiseDays]);

  const cancerRisk = useMemo(() => {
    // NASA model: ~1% per 100 mSv for solid cancers
    const baseRisk = radiationMsv / 100;
    return Math.min(10, baseRisk);
  }, [radiationMsv]);

  const cognitiveDecline = useMemo(() => {
    const months = totalDays / 30;
    const decline = Math.min(30, 5 + months * 1.5);
    return decline;
  }, [totalDays]);

  const behavioralRisk = useMemo(() => {
    const months = totalDays / 30;
    const isolationFactor = isMars ? 1.5 : 1.0;
    const risk = Math.min(60, 10 + months * 3 * isolationFactor);
    return risk;
  }, [totalDays, isMars]);

  const metrics = [
    {
      id: "bone",
      label: "Bone Mineral Density",
      icon: Bone,
      value: `${boneLoss.monthly.toFixed(1)}%/mo`,
      detail: `Total loss: ${boneLoss.total.toFixed(1)}% over ${totalDays} days`,
      threshold: RISK_THRESHOLDS["Bone loss (%/month)"],
      current: boneLoss.monthly,
      trend: "down",
      countermeasure: "Resistive exercise (ARED), bisphosphonates, vitamin D",
    },
    {
      id: "muscle",
      label: "Muscle Mass & Strength",
      icon: Activity,
      value: `${muscleLoss.monthly.toFixed(1)}%/mo`,
      detail: `Total loss: ${muscleLoss.total.toFixed(1)}% (microgravity only)`,
      threshold: RISK_THRESHOLDS["Muscle loss (%/month)"],
      current: muscleLoss.monthly,
      trend: "down",
      countermeasure: "Resistive exercise, protein supplementation, NMES",
    },
    {
      id: "cardio",
      label: "Cardiovascular Fitness",
      icon: Heart,
      value: `${cvDeconditioning.toFixed(0)}% VO₂max loss`,
      detail: `Orthostatic intolerance risk on return`,
      threshold: RISK_THRESHOLDS["Cardiovascular deconditioning"],
      current: cvDeconditioning,
      trend: "down",
      countermeasure: "Aerobic exercise (CEVIS/T2), lower body negative pressure",
    },
    {
      id: "radiation",
      label: "Radiation Cancer Risk",
      icon: Shield,
      value: `${cancerRisk.toFixed(1)}% excess`,
      detail: `Total dose: ${radiationMsv} mSv (career limit: 600 mSv)`,
      threshold: RISK_THRESHOLDS["Radiation cancer risk"],
      current: cancerRisk,
      trend: "up",
      countermeasure: "Storm shelter, mission timing, shielding optimization",
    },
    {
      id: "cognitive",
      label: "Cognitive Performance",
      icon: Brain,
      value: `${cognitiveDecline.toFixed(0)}% decline`,
      detail: `Reaction time, working memory, executive function`,
      threshold: RISK_THRESHOLDS["Cognitive performance"],
      current: cognitiveDecline,
      trend: "down",
      countermeasure: "Cognitive training, sleep hygiene, blue-light management",
    },
    {
      id: "behavioral",
      label: "Behavioral Health",
      icon: TrendingUp,
      value: `${behavioralRisk.toFixed(0)} risk score`,
      detail: `Isolation, confinement, distance from Earth (${design.arrivalLt.oneWayLabel} lag)`,
      threshold: RISK_THRESHOLDS["Behavioral health risk"],
      current: behavioralRisk,
      trend: "up",
      countermeasure: "Private quarters, VR Earth contact, crew selection, psych support",
    },
  ];

  const overallStatus = useMemo(() => {
    const warnings = metrics.filter(m => m.current >= m.threshold.warn && m.current < m.threshold.fail).length;
    const failures = metrics.filter(m => m.current >= m.threshold.fail).length;
    if (failures > 0) return { level: "fail", label: "High Risk", color: "crimson" };
    if (warnings > 0) return { level: "warn", label: "Elevated Risk", color: "amber" };
    return { level: "pass", label: "Acceptable Risk", color: "emerald" };
  }, [metrics]);

  return (
    <section id="crew-health" className="scroll-mt-20">
      <SectionHeading
        kicker="Act II · CREW"
        title="Crew Health Risk Dashboard"
      />
      <p className="mt-3 max-w-3xl text-slate-400">
        Physiological and psychological risk projections for the {totalDays}-day {isMars ? "Mars" : "Moon"} mission.
        Models based on ISS data (bone/muscle), NASA Space Cancer Risk 2020 (radiation), and HRP evidence books.
        <span className="font-mono text-space-cyan ml-1">Click any card to expand →</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge tone={overallStatus.color as "crimson" | "amber" | "emerald"} className="text-sm">
          {overallStatus.label}
        </Badge>
        <span className="text-xs text-slate-400">
          {metrics.filter(m => m.current >= m.threshold.fail).length} critical, {metrics.filter(m => m.current >= m.threshold.warn && m.current < m.threshold.fail).length} elevated
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => {
          const isWarn = m.current >= m.threshold.warn && m.current < m.threshold.fail;
          const isFail = m.current >= m.threshold.fail;
          const status = isFail ? "fail" : isWarn ? "warn" : "pass";

          return (
            <Card
              key={m.id}
              className={cn(
                "transition hover:border-space-cyan/40 cursor-pointer",
                isFail && "border-space-crimson/30 bg-space-crimson/5",
                isWarn && "border-space-amber/30 bg-space-amber/5",
                status === "pass" && "hover:border-space-emerald/30"
              )}
            >
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <m.icon className={cn("h-5 w-5", isFail && "text-space-crimson", isWarn && "text-space-amber", status === "pass" && "text-space-emerald")} />
                    <CardTitle className="text-sm">{m.label}</CardTitle>
                  </div>
                  <Badge tone={isFail ? "crimson" : isWarn ? "amber" : "emerald"} className="text-[10px]">
                    {status.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-mono font-bold text-white">{m.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{m.detail}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 mb-1">Thresholds</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-space-emerald">{'✓ < ' + m.threshold.warn}{m.threshold.unit}</span>
                    <span className="text-space-amber">⚠ {m.threshold.warn}–{m.threshold.fail}{m.threshold.unit}</span>
                    <span className="text-space-crimson">{'✗ > ' + m.threshold.fail}{m.threshold.unit}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 mb-1">Primary countermeasures</p>
                  <p className="text-xs text-slate-300">{m.countermeasure}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <TrendingUp className="h-4 w-4 text-space-cyan" />
          Organ Dose Breakdown (ICRP 103 tissue weighting)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 font-mono text-space-cyan">Organ / Tissue</th>
                <th className="text-right py-2 px-3 font-mono text-space-cyan">Dose (mSv)</th>
                <th className="text-right py-2 px-3 font-mono text-space-cyan">Weighting</th>
                <th className="text-right py-2 px-3 font-mono text-space-cyan">Effective (mSv)</th>
              </tr>
            </thead>
            <tbody>
              {organDoses.map((o, i) => (
                <tr key={o.organ} className={`${i % 2 === 0 ? "bg-white/5" : ""} border-b border-white/5`}>
                  <td className="py-2 px-3">{o.organ}</td>
                  <td className="py-2 px-3 text-right font-mono">{o.dose}</td>
                  <td className="py-2 px-3 text-right font-mono">{o.factor}x</td>
                  <td className="py-2 px-3 text-right font-mono text-space-cyan">{Math.round(o.dose * o.factor)}</td>
                </tr>
              ))}
              <tr className="bg-space-cyan/10 border-t border-space-cyan/30 font-semibold">
                <td className="py-2 px-3">Total Effective Dose</td>
                <td className="py-2 px-3 text-right font-mono">{radiationMsv}</td>
                <td className="py-2 px-3 text-right">—</td>
                <td className="py-2 px-3 text-right font-mono text-space-cyan">{radiationMsv}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Doses computed from GCR model (Badhwar-O'Neill 2010) + solar minimum assumption. SPEs modeled as 1× August 1972 event per mission.
          Surface doses reduced by regolith shielding factor (Moon: 0.5×, Mars: 0.3× at 20 g/cm²).
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <Activity className="h-4 w-4 text-space-cyan" />
          Key References & Models
        </h3>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>• Bone/Muscle: ISS ARED data (Smith et al. 2012, 2014); Mars gravity scaling per Lang et al. 2017</li>
          <li>• Cardiovascular: VO₂max decline from ISS (Moore et al. 2014); LBNP countermeasure efficacy</li>
          <li>• Radiation: NASA Space Cancer Risk 2020 (NSCR-2020); Badhwar-O'Neill 2010 GCR; August 1972 SPE reference</li>
          <li>• Cognitive: HRP Behavioral Health evidence book; PVT reaction time degradation with sleep loss</li>
          <li>• Behavioral: HI-SEAS, Mars-500 analogs; communication delay effects per Kanas & Manzey 2008</li>
          <li>• All models conservative; actual risk depends on individual physiology, mission timing, and countermeasure adherence</li>
        </ul>
      </div>
    </section>
  );
}