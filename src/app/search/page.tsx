"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, BookOpen, User, Rocket, Star, Sprout, Globe } from "lucide-react";
import { search, getAll, SearchResult } from "@/lib/search";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const typeIcons: Record<SearchResult["type"], React.ReactNode> = {
  article: <BookOpen className="h-4 w-4" />,
  persona: <User className="h-4 w-4" />,
  vehicle: <Rocket className="h-4 w-4" />,
  shower: <Star className="h-4 w-4" />,
  crop: <Sprout className="h-4 w-4" />,
  body: <Globe className="h-4 w-4" />,
};

const typeLabels: Record<SearchResult["type"], string> = {
  article: "Article",
  persona: "Persona",
  vehicle: "Vehicle",
  shower: "Meteor Shower",
  crop: "Crop",
  body: "Celestial Body",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedType, setSelectedType] = useState<SearchResult["type"] | "all">("all");

  const debouncedSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      let r = search(q, 20);
      if (selectedType !== "all") r = r.filter((x) => x.type === selectedType);
      setResults(r);
      setLoading(false);
    }, 80);
  }, [selectedType]);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Full-text search"
          title="Search articles, personas, vehicles, and celestial bodies."
          description="Fuzzy, prefix-aware, and fully client-side. The index is built from static JSON at load time — no server round-trips."
        />

        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowAll(true)}
            placeholder="Search mission design, life support, launch vehicles, personas…"
            className="w-full rounded-lg border border-white/15 bg-space-950/60 pl-12 pr-12 py-3 text-base text-white outline-none focus:border-space-cyan/60 placeholder:text-slate-500"
            autoComplete="off"
            aria-label="Search"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              aria-label="Clear"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-space-cyan" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Result type filters">
          <button
            onClick={() => setSelectedType("all")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              selectedType === "all"
                ? "border-space-cyan/40 bg-space-cyan/10 text-space-cyan"
                : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            All ({results.length})
          </button>
          {(["article", "persona", "vehicle", "shower", "crop", "body"] as SearchResult["type"][]).map((t) => {
            const count = results.filter((r) => r.type === t).length;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(selectedType === t ? "all" : t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  selectedType === t
                    ? "border-space-cyan/40 bg-space-cyan/10 text-space-cyan"
                    : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {typeLabels[t]} ({count})
              </button>
            );
          })}
        </div>

        {query && results.length === 0 && !loading && (
          <div className="mt-8 text-center text-slate-500">
            <Search className="mx-auto h-12 w-12 mb-4 text-slate-600" />
            <p className="text-lg">No results for &ldquo;{query}&rdquo;</p>
            <p className="mt-1">Try a broader term or check spelling.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <Card key={r.id} className="group">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-space-cyan">
                        {typeIcons[r.type]}
                      </span>
                      <CardTitle className="group-hover:text-space-cyan">{r.title}</CardTitle>
                    </div>
                    <Badge tone="slate">{typeLabels[r.type]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">{r.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.tags.slice(0, 4).map((t) => (
                      <Badge key={t} tone="slate">{t}</Badge>
                    ))}
                    {r.tags.length > 4 && (
                      <Badge tone="slate">+{r.tags.length - 4}</Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {!query && !showAll && (
          <div className="mt-8">
            <p className="text-center text-slate-500 mb-6">Popular starting points</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getAll().slice(0, 9).map((r) => (
                <Card key={r.id} className="group">
                  <CardBody>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-space-cyan">
                        {typeIcons[r.type]}
                      </span>
                      <CardTitle className="group-hover:text-space-cyan">{r.title}</CardTitle>
                    </div>
                    <Badge tone="slate">{typeLabels[r.type]}</Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}