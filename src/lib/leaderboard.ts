/**
 * Local leaderboard — tracks personal best scores per scenario in localStorage.
 * Pure and unit-tested in tests/leaderboard.test.ts.
 */

import { type Scenario } from "@/lib/scenarios";
import { type Scorecard } from "@/lib/score";

export interface LeaderboardEntry {
  scenarioId: string;
  grade: "S" | "A" | "B" | "C" | "D";
  score: number;
  destination: "moon" | "mars";
  vehicleId: string;
  crew: number;
  surfaceDays: number;
  totalDays: number;
  radiationMsv: number;
  achievedAt: string;
}

const STORAGE_KEY = "nasamap.leaderboard.v1";
const MAX_ENTRIES_PER_SCENARIO = 10;

function readLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(entries: LeaderboardEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

export function submitScore(
  scenario: Scenario,
  design: any,
  scorecard: Scorecard
): LeaderboardEntry | null {
  if (!scenario) return null;

  const entry: LeaderboardEntry = {
    scenarioId: scenario.id,
    grade: scorecard.grade,
    score: scorecard.score,
    destination: design.destination,
    vehicleId: design.vehicle.id,
    crew: design.crew,
    surfaceDays: design.surfaceDays,
    totalDays: design.totalDays,
    radiationMsv: design.radiationMsvTotal,
    achievedAt: new Date().toISOString(),
  };

  const entries = readLeaderboard();
  const filtered = entries.filter((e) => e.scenarioId !== scenario.id);
  const updated = [entry, ...filtered].slice(0, MAX_ENTRIES_PER_SCENARIO);
  writeLeaderboard(updated);

  return entry;
}

export function getLeaderboard(scenarioId?: string): LeaderboardEntry[] {
  const entries = readLeaderboard();
  if (scenarioId) {
    return entries.filter((e) => e.scenarioId === scenarioId);
  }
  return entries;
}

export function getTopScore(scenarioId: string): LeaderboardEntry | undefined {
  const entries = getLeaderboard(scenarioId);
  if (entries.length === 0) return undefined;
  return entries.reduce((best, e) => (e.score > best.score ? e : best));
}

export function getAllTimeStats(): {
  totalRuns: number;
  bestGrade: "S" | "A" | "B" | "C" | "D" | null;
  totalStars: number;
  scenariosCompleted: number;
} {
  const entries = readLeaderboard();
  if (entries.length === 0) {
    return { totalRuns: 0, bestGrade: null, totalStars: 0, scenariosCompleted: 0 };
  }

  const gradeOrder: ("D" | "C" | "B" | "A" | "S")[] = ["D", "C", "B", "A", "S"];
  const bestGrade = entries.reduce((best, e) => {
    const eIdx = gradeOrder.indexOf(e.grade);
    const bIdx = best ? gradeOrder.indexOf(best) : -1;
    return eIdx > bIdx ? e.grade : best;
  }, null as "S" | "A" | "B" | "C" | "D" | null);

  const totalStars = entries.reduce((sum, e) => {
    if (e.grade === "S") return sum + 3;
    if (e.grade === "A") return sum + 2;
    if (e.grade === "B") return sum + 1;
    return sum;
  }, 0);

  const scenariosCompleted = new Set(entries.map((e) => e.scenarioId)).size;

  return { totalRuns: entries.length, bestGrade, totalStars, scenariosCompleted };
}

export function clearLeaderboard(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportLeaderboardCSV(): string {
  const entries = readLeaderboard();
  if (entries.length === 0) return "";

  const headers = [
    "scenarioId",
    "grade",
    "score",
    "destination",
    "vehicleId",
    "crew",
    "surfaceDays",
    "totalDays",
    "radiationMsv",
    "achievedAt",
  ];

  const rows = entries.map((e) => [
    e.scenarioId,
    e.grade,
    e.score.toString(),
    e.destination,
    e.vehicleId,
    e.crew.toString(),
    e.surfaceDays.toString(),
    e.totalDays.toString(),
    e.radiationMsv.toString(),
    e.achievedAt,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function gradeColor(grade: string): string {
  if (grade === "S") return "#00f59c";
  if (grade === "A") return "#ffb300";
  if (grade === "B") return "#64748b";
  return "#ff4d6a";
}

export function generateLeaderboardBadge(entry: LeaderboardEntry, scenarioTitle: string): string {
  const color = gradeColor(entry.grade);
  const stars = "★".repeat(entry.grade === "S" ? 3 : entry.grade === "A" ? 2 : entry.grade === "B" ? 1 : 0);
  const emptyStars = "☆".repeat(3 - (entry.grade === "S" ? 3 : entry.grade === "A" ? 2 : entry.grade === "B" ? 1 : 0));

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0b1120;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1f3a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gradeBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}CC;stop-opacity:1" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="120" rx="12" fill="url(#bg)" stroke="#22d3ee" stroke-width="2" filter="url(#glow)"/>
  
  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="120" rx="12 0 0 12" fill="url(#gradeBar)"/>
  
  <!-- Title area -->
  <text x="20" y="30" font-family="JetBrains Mono, monospace" font-size="14" font-weight="bold" fill="#22d3ee">NASAMAP LEADERBOARD</text>
  
  <!-- Scenario title -->
  <text x="20" y="55" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="#ffffff">${scenarioTitle}</text>
  
  <!-- Grade and score -->
  <g transform="translate(20, 85)">
    <rect width="80" height="30" rx="6" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="1"/>
    <text x="40" y="22" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="16" font-weight="bold" fill="${color}" filter="url(#glow)">${entry.grade}</text>
  </g>
  
  <text x="120" y="102" font-family="JetBrains Mono, monospace" font-size="24" font-weight="bold" fill="#ffffff">${entry.score}</text>
  <text x="180" y="102" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8">/ 100</text>
  
  <!-- Stars -->
  <text x="380" y="35" text-anchor="end" font-family="Inter, sans-serif" font-size="20" fill="#ffb300">${stars}${emptyStars}</text>
  
  <!-- Details -->
  <g transform="translate(20, 105)" font-family="JetBrains Mono, monospace" font-size="10" fill="#64748b">
    <text x="0" y="0">Vehicle: ${entry.vehicleId}</text>
    <text x="140" y="0">Crew: ${entry.crew}</text>
    <text x="220" y="0">Surface: ${entry.surfaceDays}d</text>
    <text x="310" y="0">${entry.radiationMsv}mSv</text>
  </g>
  
  <!-- Date -->
  <text x="380" y="110" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9" fill="#475569">${new Date(entry.achievedAt).toLocaleDateString()}</text>
</svg>
`;
}