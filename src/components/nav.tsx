import Link from "next/link";
import { Rocket, Compass, Radio, Library, Search, Orbit } from "lucide-react";

const links = [
  { href: "/mission", label: "Mission", icon: Rocket },
  { href: "/fly", label: "Fly", icon: Orbit },
  { href: "/commons", label: "Data Commons", icon: Compass },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/library", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-space-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 text-space-cyan transition group-hover:bg-space-cyan/20">
            <Rocket className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-widest text-white">
            NASA<span className="text-space-cyan">MAP</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/mission"
          className="rounded-lg bg-space-cyan px-4 py-2 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/80"
        >
          Start a mission
        </Link>
      </div>
    </header>
  );
}