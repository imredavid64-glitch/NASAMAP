import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";

export function PagePlaceholder({
  icon: Icon,
  kicker,
  title,
  description,
  phase,
  bullets,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  phase: string;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-space-cyan/30 bg-space-cyan/10 text-space-cyan">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="kicker">{kicker}</p>
          <SectionHeading title={title} className="mt-2" />
        </div>
      </div>
      <p className="mt-6 max-w-2xl text-slate-400">{description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-6">
          <Badge tone="amber" className="mb-3">
            building · {phase}
          </Badge>
          <ul className="space-y-2 text-sm text-slate-300">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}