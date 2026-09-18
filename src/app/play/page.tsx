import type { Metadata } from "next";
import { ScenarioBoard } from "./ScenarioBoard";

export const metadata: Metadata = { title: "Play — Space Mission Design Game" };

export default function PlayPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <p className="kicker mb-3">Space Mission Design Game</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Pick a mission. Beat the rating.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Each brief sets hard constraints and objectives on top of the real design engine — the same one the planners
          use. Earn up to three stars per mission: meet the constraints, clear the objectives, then beat the par score.
          Your progress stays in this browser.
        </p>
        <ScenarioBoard />
      </div>
    </div>
  );
}