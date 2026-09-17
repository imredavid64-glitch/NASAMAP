import Link from "next/link";
import articles from "@/data/articles.json";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { BookOpen, Tag, Clock, Calendar } from "lucide-react";

export const metadata = { title: "Library — Mission Briefs & Science Notes" };

const cats = [...new Set(articles.map((a) => a.category))].sort();

export default function LibraryPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Mission library"
          title="Curated briefs on mission design, life support, and space operations."
          description="Every article is a static MDX file in the repo — no CMS, no database. Filter by category or jump to search for full-text fuzzy matching."
        />

        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Category filters">
          <button
            className="rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-4 py-1.5 text-sm font-medium text-space-cyan"
            data-cat="all"
          >
            All ({articles.length})
          </button>
          {cats.map((c) => (
            <button
              key={c}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:border-white/30"
              data-cat={c}
            >
              {c} ({articles.filter((a) => a.category === c).length})
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" id="article-grid">
          {articles.map((a) => (
            <article key={a.slug} className="article-card" data-category={a.category}>
              <Link href={`/library/${a.slug}`} className="block">
                <Card className="h-full transition hover:border-space-cyan/40 hover:bg-white/[0.06]">
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex-1 pr-2">{a.title}</CardTitle>
                    </div>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-3">{a.excerpt}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge tone="cyan">{a.category}</Badge>
                      {a.tags.slice(0, 3).map((t) => (
                        <Badge key={t} tone="slate">{t}</Badge>
                      ))}
                      {a.tags.length > 3 && (
                        <Badge tone="slate">+{a.tags.length - 3} more</Badge>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {a.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {a.readTimeMin} min read
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Want full-text search across articles, personas, vehicles, and celestial bodies?{" "}
          <Link href="/search" className="text-space-cyan hover:underline">
            Open Search →
          </Link>
        </p>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              const buttons = document.querySelectorAll('[data-cat]');
              const cards = document.querySelectorAll('.article-card');
              buttons.forEach(btn => btn.addEventListener('click', () => {
                const cat = btn.dataset.cat;
                buttons.forEach(b => b.classList.remove('border-space-cyan/40','bg-space-cyan/10','text-space-cyan'));
                buttons.forEach(b => b.classList.add('border-white/15','bg-white/5','text-slate-300'));
                btn.classList.remove('border-white/15','bg-white/5','text-slate-300');
                btn.classList.add('border-space-cyan/40','bg-space-cyan/10','text-space-cyan');
                cards.forEach(card => {
                  if (cat === 'all' || card.dataset.category === cat) card.style.display = '';
                  else card.style.display = 'none';
                });
              }));
            })();
          `,
        }}
      />
    </div>
  );
}