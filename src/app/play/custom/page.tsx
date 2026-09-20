import type { Metadata } from "next";
import { ScenarioBoard } from "../ScenarioBoard";

export const metadata: Metadata = { title: "Custom Mission — Space Mission Design Game" };

export default function CustomPlayPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <p className="kicker mb-3">Space Mission Design Game</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Custom Mission Builder
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Create your own mission brief with custom constraints, objectives, and par score.
          The first card on the board is the builder — design it, copy the link, and play.
        </p>
        <ScenarioBoard />
      </div>
    </div>
  );
}