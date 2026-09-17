import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import articles from "@/data/articles.json";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  return { title: article ? `${article.title} — Library` : "Article not found" };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <div className="pt-28">
      <article className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-space-cyan mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="cyan">{article.category}</Badge>
            {article.tags.map((t) => (
              <Badge key={t} tone="slate">{t}</Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {article.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {article.readTimeMin} min read
            </span>
          </div>
        </header>

        <div className="prose prose-invert max-w-none text-slate-300">
          <div dangerouslySetInnerHTML={{ __html: markedParse(article.body) }} />
        </div>

        {article.sources.length > 0 && (
          <section className="mt-12 border-t border-white/10 pt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Sources</h2>
            <ul className="space-y-2 text-sm text-slate-400">
              {article.sources.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-space-cyan/60" />
                  <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-space-cyan">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}

function markedParse(md: string): string {
  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    .replace(/^\| (.*?) \|$/gim, "<div class='table-row'><div>$1</div></div>")
    .replace(/^\|?\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|?$/gim, "<div class='table-row'><div>$1</div><div>$2</div><div>$3</div></div>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
    .replace(/\n\n/gim, "</p><p>")
    .replace(/^(.*$)/gim, "<p>$1</p>")
    .replace(/<p><h([1-3])>/gim, "<h$1>")
    .replace(/<\/h([1-3])><\/p>/gim, "</h$1>")
    .replace(/<p><ul>/gim, "<ul>")
    .replace(/<\/ul><\/p>/gim, "</ul>")
    .replace(/<p><div class='table-row'>/gim, "<div class='table-row'>")
    .replace(/<\/div><\/p>/gim, "</div>");
}