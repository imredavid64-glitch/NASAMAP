import { Rocket, Compass, Radio, Library, Search, Orbit, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/mission", label: "Mission", icon: Rocket },
  { href: "/fly", label: "Fly", icon: Orbit },
  { href: "/commons", label: "Data Commons", icon: Compass },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/library", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
];