import { cn } from "@/lib/cn";

const tones = {
  cyan: "bg-space-cyan/10 text-space-cyan border-space-cyan/30",
  amber: "bg-space-amber/10 text-space-amber border-space-amber/30",
  crimson: "bg-space-crimson/10 text-space-crimson border-space-crimson/30",
  emerald: "bg-space-emerald/10 text-space-emerald border-space-emerald/30",
  slate: "bg-white/5 text-slate-300 border-white/10",
} as const;

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        tones[tone],
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {children}
    </span>
  );
}