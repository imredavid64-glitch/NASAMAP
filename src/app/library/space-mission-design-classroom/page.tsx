import { Printer, Download, BookOpen, FileText, GraduationCap, Award, Target } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = {
  title: "Space Mission Design — Classroom Resources",
  description: "NGSS-aligned lesson plans, printable worksheets, and teacher guide for systems engineering with real NASA data.",
};

const STANDARDS = [
  {
    code: "HS-ETS1-1",
    title: "Define Criteria & Constraints",
    description: "Analyze a major global challenge to specify qualitative and quantitative criteria and constraints for solutions.",
    activity: "Mission brief analysis — students identify constraints (vehicle, crew, radiation, surface time) and success criteria.",
  },
  {
    code: "HS-ETS1-2",
    title: "Decompose Complex Problems",
    description: "Design a solution to a complex real-world problem by breaking it down into smaller, manageable problems.",
    activity: "Mission Lab — decompose Δv budget, radiation dose, ECLSS mass, comms lag, and cost into solvable sub-problems.",
  },
  {
    code: "HS-ESS3-4",
    title: "Tech Solutions for Human Impacts",
    description: "Evaluate or refine a technological solution that reduces impacts of human activities on natural systems.",
    activity: "Earth Impact panel — trace ECLSS water recycling → municipal systems, solar sizing → off-grid microgrids.",
  },
  {
    code: "HS-PS3-3",
    title: "Energy Conversion Design",
    description: "Design, build, and refine a device that converts one form of energy into another within constraints.",
    activity: "Ops Budget — size solar array from ECLSS load using inverse-square law (1.361 kW/m² ÷ AU²) at Moon vs Mars.",
  },
  {
    code: "HS-LS1-3",
    title: "Homeostasis Feedback",
    description: "Plan and conduct an investigation to provide evidence that feedback mechanisms maintain homeostasis.",
    activity: "Crew Health — bone loss (1.5%/mo microgravity), muscle, cardiovascular deconditioning, radiation cancer risk models.",
  },
  {
    code: "HS-PS4-2",
    title: "Wave Comms & Digital Transmission",
    description: "Evaluate questions about advantages of digital transmission and storage of information.",
    activity: "Comms Window — light-lag (1.3s Moon, 25 min Mars round-trip) drives autonomy requirements for telerobotics.",
  },
] as const;

const WORKSHEETS = [
  {
    id: "mission-brief",
    title: "Mission Brief Analysis",
    icon: Target,
    description: "Identify constraints, objectives, and success criteria from a mission brief.",
    pages: 2,
    standards: ["HS-ETS1-1"],
    difficulty: "Introductory",
    time: "20 min",
  },
  {
    id: "delta-v-budget",
    title: "Δv Budget Worksheet",
    icon: Award,
    description: "Calculate Hohmann transfer Δv for Moon and Mars; compare to vehicle capability.",
    pages: 3,
    standards: ["HS-ETS1-2", "HS-PS3-3"],
    difficulty: "Intermediate",
    time: "35 min",
  },
  {
    id: "radiation-dose",
    title: "Radiation Dose Calculator",
    icon: GraduationCap,
    description: "Compute crew dose from GCR + SPE models; check against NASA-STD-3001 600 mSv career limit.",
    pages: 2,
    standards: ["HS-ESS3-4", "HS-LS1-3"],
    difficulty: "Intermediate",
    time: "25 min",
  },
  {
    id: "eclss-budget",
    title: "ECLSS Closed-Loop Budget",
    icon: BookOpen,
    description: "Balance O₂, H₂O, food masses with ISS-class recycling (90% H₂O, 50% O₂); size solar array.",
    pages: 3,
    standards: ["HS-ETS1-2", "HS-PS3-3", "HS-ESS3-4"],
    difficulty: "Advanced",
    time: "40 min",
  },
  {
    id: "mission-scorecard",
    title: "Mission Scorecard & GO/NO-GO",
    icon: FileText,
    description: "Rate a design across 7 weighted objectives; apply feasibility caps (lift, radiation).",
    pages: 2,
    standards: ["HS-ETS1-1", "HS-ETS1-2"],
    difficulty: "Intermediate",
    time: "30 min",
  },
  {
    id: "earth-spinoffs",
    title: "Earth Spinoff Mapping",
    icon: GraduationCap,
    description: "Map each mission subsystem to a terrestrial application with NASA spinoff references.",
    pages: 2,
    standards: ["HS-ESS3-4"],
    difficulty: "Introductory",
    time: "20 min",
  },
] as const;

function WorksheetCard({ ws }: { ws: typeof WORKSHEETS[number] }) {
  return (
    <Card className="glass-panel transition hover:border-space-cyan/40">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
              <ws.icon className="h-5 w-5 text-space-cyan" />
            </div>
            <div>
              <CardTitle className="text-sm">{ws.title}</CardTitle>
              <p className="mt-1 text-xs text-slate-400">{ws.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-space-cyan/20 text-space-cyan">
              {ws.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
              {ws.time}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ws.standards.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{ws.pages} pages</span>
          <button className="inline-flex items-center gap-1 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-1.5 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20">
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ClassroomPage() {
  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="FOR EDUCATORS"
          title="Space Mission Design — Classroom Resources"
          description="NGSS-aligned, systems-engineering case study using real NASA data. Every worksheet pulls numbers from the same physics engine that powers the Mission Lab — no lookup tables, no hand-waving."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="glass-panel">
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-space-cyan" />
                Teacher Quick-Start
              </CardTitle>
              <ol className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex gap-2"><span className="font-mono text-space-cyan">1.</span> Open <a href="/play" className="text-space-cyan hover:underline">/play</a> → "Artemis: Crewed Lunar Landing" — 10 min guided play.</li>
                <li className="flex gap-2"><span className="font-mono text-space-cyan">2.</span> Distribute <strong>Mission Brief Analysis</strong> worksheet — students decode constraints.</li>
                <li className="flex gap-2"><span className="font-mono text-space-cyan">3.</span> Mission Lab (<a href="/mission" className="text-space-cyan hover:underline">/mission</a>) — teams design, score, iterate for 3★.</li>
                <li className="flex gap-2"><span className="font-mono text-space-cyan">4.</span> <strong>Δv Budget</strong> + <strong>Radiation Dose</strong> worksheets — compute by hand, verify in app.</li>
                <li className="flex gap-2"><span className="font-mono text-space-cyan">5.</span> <strong>ECLSS Budget</strong> — close the loop, size the array, download Mission Patch.</li>
                <li className="flex gap-2"><span className="font-mono text-space-cyan">6.</span> <strong>Earth Spinoffs</strong> — connect each subsystem to a terrestrial application.</li>
              </ol>
              <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                <p className="text-xs text-slate-400">
                  <strong>No accounts, no login, no data collection.</strong> All designs saved in browser localStorage.
                  Works offline after first visit (PWA). Print worksheets from PDF or use the app directly.
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="glass-panel">
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-space-cyan" />
                NGSS Standards Alignment
              </CardTitle>
              <ul className="mt-4 space-y-3">
                {STANDARDS.map((s) => (
                  <li key={s.code} className="flex gap-3">
                    <span className="shrink-0 font-mono text-xs text-space-cyan">{s.code}</span>
                    <div>
                      <p className="font-medium text-white text-sm">{s.title}</p>
                      <p className="text-xs text-slate-400">{s.description}</p>
                      <p className="mt-1 text-xs text-slate-500 italic">Activity: {s.activity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <SectionHeading
          kicker="WORKSHEETS"
          title="Printable Student Worksheets"
          description="Each worksheet is a self-contained PDF with worked examples, blank templates, and answer keys. Designed for 50-min class periods."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSHEETS.map((ws) => (
            <WorksheetCard key={ws.id} ws={ws} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <FileText className="h-5 w-5 text-space-cyan" />
            Master Teacher Guide (Single PDF)
          </h3>
          <p className="mt-2 text-slate-400">
            All 6 worksheets + answer keys + rubric + extension activities + standards crosswalk in one document.
          </p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-space-cyan px-5 py-2.5 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/90">
            <Download className="h-4 w-4" />
            Download Teacher Guide (PDF, 18 pages)
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-space-cyan/30 bg-space-cyan/5 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
            <Award className="h-5 w-5 text-space-cyan" />
            Assessment Rubric (4-Level)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 font-mono text-space-cyan">Dimension</th>
                  <th className="text-center py-2 px-3 font-mono text-space-cyan">1 — Emerging</th>
                  <th className="text-center py-2 px-3 font-mono text-space-cyan">2 — Developing</th>
                  <th className="text-center py-2 px-3 font-mono text-space-cyan">3 — Proficient</th>
                  <th className="text-center py-2 px-3 font-mono text-space-cyan">4 — Exemplary</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Constraint Analysis</td>
                  <td className="text-center py-2 px-3">Identifies {`<50%`} of constraints</td>
                  <td className="text-center py-2 px-3">Identifies most constraints</td>
                  <td className="text-center py-2 px-3">Identifies all constraints with quantitative values</td>
                  <td className="text-center py-2 px-3">Identifies constraints + explains trade-offs</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Quantitative Modeling</td>
                  <td className="text-center py-2 px-3">Calculations incomplete or incorrect</td>
                  <td className="text-center py-2 px-3">Calculations mostly correct</td>
                  <td className="text-center py-2 px-3">All calculations correct with units</td>
                  <td className="text-center py-2 px-3">Correct + explains sensitivity to assumptions</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Systems Thinking</td>
                  <td className="text-center py-2 px-3">Treats subsystems in isolation</td>
                  <td className="text-center py-2 px-3">Identifies 1-2 cross-couplings</td>
                  <td className="text-center py-2 px-3">Explains Δv↔mass↔ECLSS↔cost coupling</td>
                  <td className="text-center py-2 px-3">Optimizes across couplings; justifies choices</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Evidence & Citation</td>
                  <td className="text-center py-2 px-3">No sources cited</td>
                  <td className="text-center py-2 px-3">Cites app output only</td>
                  <td className="text-center py-2 px-3">Cites NASA references (STD-3001, ISS ECLSS, MSL RAD)</td>
                  <td className="text-center py-2 px-3">Cites references + evaluates confidence levels</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Communication</td>
                  <td className="text-center py-2 px-3">Minimal explanation</td>
                  <td className="text-center py-2 px-3">Explains key steps</td>
                  <td className="text-center py-2 px-3">Clear narrative with Mission Report Card</td>
                  <td className="text-center py-2 px-3">Compelling story; connects to Earth spinoffs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}