"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Download, Copy, ExternalLink, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { StageEditor } from "./StageEditor";
import { PerformancePanel } from "./PerformancePanel";
import { RocketTemplates } from "./RocketTemplates";
import { ExportActions } from "./ExportActions";
import { validateRocket, calculateRocketPerformance, type RocketDesign, ENGINES, TANKS } from "@/lib/rocket-builder";
import { encodeDesignQuery, DEFAULT_DESIGN } from "@/lib/design-link";
import { useToast, successToast } from "@/components/ui/toast";

const TEMPLATES: RocketDesign[] = [
  {
    id: "falcon-9",
    name: "Falcon 9 (Block 5)",
    description: "SpaceX's workhorse — reusable first stage, 9× Merlin 1D, RP-1/LOX",
    stages: [
      {
        id: "stage-1",
        name: "Stage 1 (Booster)",
        engines: [{ engineId: "merlin-1d", count: 9 }],
        tankId: "falcon-9-tank",
        interstageMassKg: 500,
        avionicsMassKg: 200,
        tpsMassKg: 100,
        recoveryMassKg: 3500,
        isBooster: true,
        separationMechanism: "pyrotechnic",
      },
      {
        id: "stage-2",
        name: "Stage 2",
        engines: [{ engineId: "merlin-vac", count: 1 }],
        tankId: "falcon-9-s2-tank",
        interstageMassKg: 500,
        avionicsMassKg: 200,
        tpsMassKg: 100,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "starship",
    name: "Starship (Target Config)",
    description: "Fully reusable super-heavy — 33× Raptor SL + 6× Raptor Vac, CH4/LOX",
    stages: [
      {
        id: "stage-1",
        name: "Super Heavy Booster",
        engines: [{ engineId: "raptor-sl", count: 33 }],
        tankId: "starship-superheavy-tank",
        interstageMassKg: 2000,
        avionicsMassKg: 500,
        tpsMassKg: 5000,
        recoveryMassKg: 20000,
        isBooster: true,
        separationMechanism: "pyrotechnic",
      },
      {
        id: "stage-2",
        name: "Starship Ship",
        engines: [
          { engineId: "raptor-sl", count: 3 },
          { engineId: "raptor-vac", count: 3 },
        ],
        tankId: "starship-ship-tank",
        interstageMassKg: 0,
        avionicsMassKg: 500,
        tpsMassKg: 10000,
        recoveryMassKg: 15000,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "sls-block-1",
    name: "SLS Block 1",
    description: "NASA's Artemis rocket — 4× RS-25 + 2× 5-seg SRBs, LH2/LOX core",
    stages: [
      {
        id: "stage-1",
        name: "Core Stage",
        engines: [{ engineId: "rs-25", count: 4 }],
        tankId: "sls-core-tank",
        interstageMassKg: 2000,
        avionicsMassKg: 1000,
        tpsMassKg: 2000,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
      {
        id: "stage-2",
        name: "ICPS",
        engines: [{ engineId: "rl10c-1", count: 1 }],
        tankId: "sls-icps-tank",
        interstageMassKg: 500,
        avionicsMassKg: 200,
        tpsMassKg: 200,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "saturn-v",
    name: "Saturn V",
    description: "Apollo Moon rocket — 5× F-1 + 5× J-2 + 1× J-2, RP-1/LOX + LH2/LOX",
    stages: [
      {
        id: "stage-1",
        name: "S-IC",
        engines: [{ engineId: "f-1", count: 5 }],
        tankId: "saturn-v-s1c-tank",
        interstageMassKg: 3000,
        avionicsMassKg: 500,
        tpsMassKg: 1000,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
      {
        id: "stage-2",
        name: "S-II",
        engines: [{ engineId: "j-2", count: 5 }],
        tankId: "saturn-v-s2-tank",
        interstageMassKg: 2000,
        avionicsMassKg: 500,
        tpsMassKg: 500,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
      {
        id: "stage-3",
        name: "S-IVB",
        engines: [{ engineId: "j-2", count: 1 }],
        tankId: "saturn-v-s4b-tank",
        interstageMassKg: 1000,
        avionicsMassKg: 300,
        tpsMassKg: 300,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
];

function createDefaultCustom(): RocketDesign {
  return {
    id: `custom-${Date.now()}`,
    name: "Custom Rocket",
    description: "",
    stages: [
      {
        id: "stage-1",
        name: "Stage 1",
        engines: [{ engineId: "merlin-1d", count: 9 }],
        tankId: "falcon-9-tank",
        interstageMassKg: 500,
        avionicsMassKg: 200,
        tpsMassKg: 100,
        recoveryMassKg: 0,
        isBooster: false,
        separationMechanism: "pyrotechnic",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

export function RocketBuilder() {
  const { toast } = useToast();
  const [design, setDesign] = useState<RocketDesign>(createDefaultCustom());
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [performance, setPerformance] = useState<ReturnType<typeof calculateRocketPerformance> | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Recalculate performance when design changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      try {
        const perf = calculateRocketPerformance(design);
        setPerformance(perf);
        setValidation(validateRocket(design));
      } catch (e) {
        console.error("Performance calculation failed", e);
        setPerformance(null);
        setValidation({ valid: false, errors: ["Calculation error"] });
      } finally {
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [design]);

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "custom") {
      setDesign(createDefaultCustom());
      setSelectedTemplate("custom");
    } else {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setDesign(JSON.parse(JSON.stringify(template))); // deep clone
        setSelectedTemplate(templateId);
      }
    }
  };

  const handleDesignUpdate = (newDesign: RocketDesign) => {
    setDesign({ ...newDesign, updatedAt: new Date().toISOString(), version: design.version + 1 });
  };

  const handleExportJson = () => {
    const json = JSON.stringify(design, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${design.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: "success", title: "Design exported" });
  };

  const handleCopyMissionLink = () => {
    // Use the first stage's performance as a proxy for a "custom vehicle" in Mission Lab
    if (!performance) return;
    const payloadLEO = performance.payloadLEOKg ?? 0;
    const vehicleId = `custom-${design.id}`;
    const query = encodeDesignQuery({
      ...DEFAULT_DESIGN,
      vehicleId,
    });
    const url = `${window.location.origin}/mission?${query}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ type: "success", title: "Mission Lab link copied", description: "Open /mission to use this rocket" });
  };

  const handleUseInMissionLab = () => {
    if (!performance) return;
    const query = encodeDesignQuery({
      ...DEFAULT_DESIGN,
      vehicleId: `custom-${design.id}`,
    });
    window.location.href = `/mission?${query}`;
  };

  const canUseInMissionLab = Boolean(performance && performance.payloadLEOKg && performance.payloadLEOKg > 0);

  return (
    <div>
      <SectionHeading
        kicker="Astrodynamics Lab"
        title="Rocket Builder"
        description="Design multi-stage rockets from real engines and tanks. Live Δv, TWR, payload estimates, and cost. Export to Mission Lab."
      />

      {/* Template Selector */}
      <div className="mt-6">
        <RocketTemplates
          templates={TEMPLATES}
          selected={selectedTemplate}
          onSelect={handleTemplateSelect}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Left: Stage Editor */}
        <Card className="h-full">
          <CardBody>
            <StageEditor
              design={design}
              onUpdate={handleDesignUpdate}
              engines={ENGINES}
              tanks={TANKS}
            />
          </CardBody>
        </Card>

        {/* Right: Performance + Export */}
        <div className="space-y-4">
          <PerformancePanel performance={performance} validation={validation} loading={loading} />

          <Card>
            <CardBody>
              <ExportActions
                design={design}
                performance={performance}
                canUseInMissionLab={canUseInMissionLab}
                onExportJson={handleExportJson}
                onCopyMissionLink={handleCopyMissionLink}
                onUseInMissionLab={handleUseInMissionLab}
                copied={copied}
              />
            </CardBody>
          </Card>

          {/* Validation Errors */}
          {!validation.valid && validation.errors.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardBody>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400 shrink-0" />
                  <div>
                    <p className="font-medium text-red-300">Design Validation Failed</p>
                    <ul className="mt-2 space-y-1 text-sm text-red-200">
                      {validation.errors.map((e, i) => (
                        <li key={i} className="flex gap-1">
                          <span>•</span> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Info Panel */}
          <Card>
            <CardBody>
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-space-cyan shrink-0" />
                <div className="text-sm text-slate-400 space-y-2">
                  <p><strong>All math runs in your browser.</strong> No server compute. Uses Tsiolkovsky rocket equation with staged mass ratios.</p>
                  <p>Engine/tank data from NASA, SpaceX, ULA, ArianeGroup, Blue Origin public specs. Tagged as <code className="bg-space-950 px-1 rounded">documented</code> or <code className="bg-space-950 px-1 rounded">estimate</code>.</p>
                  <p>Payload estimates are <strong>rough</strong> (1.5–4% of liftoff mass). For real mission design, use the Porkchop Plot and Mission Lab.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}