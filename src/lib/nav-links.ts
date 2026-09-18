import { Rocket, Compass, Radio, Library, Search, Orbit, Trophy, Gamepad2, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/mission", label: "Mission Lab", icon: Rocket },
  { href: "/fly", label: "Fly", icon: Orbit },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/commons", label: "Data Commons", icon: Compass },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/library", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
];