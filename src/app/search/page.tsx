import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PagePlaceholder
      icon={Search}
      kicker="Every fact, findable"
      title="Search the whole platform."
      phase="Phase 2 — static index"
      description="A client-side search over the static knowledge base (datasets, articles, glossary, formulas). Built against a prebuilt index so it works with zero backend."
      bullets={[
        "Fuzzy matching across bodies, missions, launch vehicles, glossary",
        "Formula + source snippets surfaced next to facts",
        "Offline-friendly static index",
      ]}
    />
  );
}