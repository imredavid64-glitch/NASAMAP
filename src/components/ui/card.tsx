import Link from "next/link";
import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export function Card({
  className,
  children,
  href,
  id,
}: {
  className?: string;
  children: ReactNode;
  href?: string;
  id?: string;
}) {
  const base = cn("glass-panel p-6", className);
  if (href) {
    return (
      <Link id={id} href={href} className={cn(base, "transition hover:border-space-cyan/40 hover:bg-white/[0.06]")} role="link" aria-label={typeof children === 'string' ? children : undefined}>
        {children}
      </Link>
    );
  }
  return (
    <div id={id} className={base} role="region">
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h3 className={cn("text-base font-semibold text-white", className)}>{children}</h3>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-2 text-sm text-slate-400", className)}>{children}</div>;
}