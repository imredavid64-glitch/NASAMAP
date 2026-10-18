import { Rocket, Compass, Radio, Library, Search, Orbit, Trophy, Gamepad2, Wrench, Users, BookOpen, Award, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only show in judge mode (?judge=1 or ?tour=judge) */
  judgeOnly?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/play/narrative", label: "Narrative", icon: BookOpen },
  { href: "/mission", label: "Mission Lab", icon: Rocket },
  { href: "/fly", label: "Fly", icon: Orbit },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/commons", label: "Data Commons", icon: Compass },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/library", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/community", label: "Community", icon: Users },
  { href: "/judge", label: "Judge Tour", icon: Award, judgeOnly: true },
];