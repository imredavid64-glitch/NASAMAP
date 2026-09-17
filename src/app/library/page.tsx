import type { Metadata } from "next";
import { Library } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <PagePlaceholder
      icon={Library}
      kicker="Knowledge base"
      title="The science behind the sky, sourced."
      phase="Phase 2-3 — encyclopedia + story mode + teacher mode"
      description="Long-form articles, mission histories, glossary and classroom-ready explainers stored as Markdown in GitHub. Every page shows the formula behind the number and the NASA product it came from."
      bullets={[
        "Story mode — 'A Letter from the Frontier': Apollo 11 replay, Artemis, Mars",
        "Encyclopedia — planets, spacecraft, launch vehicles drawn from typed JSON",
        "Glossary + quizzes with printable Teacher Mode mission cards",
        "Search across the entire knowledge base",
      ]}
    />
  );
}