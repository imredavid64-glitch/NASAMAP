import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <p>
          <span className="font-semibold text-slate-300">NASAMAP</span> · NASA Space Apps Challenge 2026 · "The
          Next Frontier"
        </p>
        <div className="flex items-center gap-4">
          <Link href="/library" className="transition hover:text-space-cyan">
            Library
          </Link>
          <Link href="/search" className="transition hover:text-space-cyan">
            Search
          </Link>
          <span className="font-mono text-[11px]">open data · no account · no database</span>
        </div>
      </div>
    </footer>
  );
}