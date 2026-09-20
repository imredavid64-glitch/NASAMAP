import Link from "next/link";
import { Rocket } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav-links";
import { MobileNav } from "./mobile-nav";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-space-950/70 backdrop-blur-md" role="banner">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2" aria-label="NASAMAP Home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 text-space-cyan transition group-hover:bg-space-cyan/20" aria-hidden="true">
            <Rocket className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-widest text-white">
            NASA<span className="text-space-cyan">MAP</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" role="navigation" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
              aria-label={l.label}
            >
              <l.icon className="h-4 w-4" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/play"
            className="hidden rounded-lg bg-space-cyan px-4 py-2 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/80 sm:inline-block focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
          >
            Start the game
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}