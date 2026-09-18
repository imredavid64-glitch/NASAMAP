import { BookOpen } from "lucide-react";
import { GLOSSARY } from "@/lib/glossary";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export function GlossaryCard({ open }: { open: boolean }) {
  return (
    <Card className="scroll-mt-20">
      <CardBody>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-space-cyan" /> Mission glossary
        </CardTitle>
        {open && (
          <dl className="mt-4 space-y-4">
            {GLOSSARY.map((g) => (
              <div key={g.key}>
                <dt className="text-sm font-semibold text-white">{g.term}</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-slate-400">{g.short}</dd>
                <dd className="mt-0.5 text-[11px] text-slate-600">{g.expert}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardBody>
    </Card>
  );
}