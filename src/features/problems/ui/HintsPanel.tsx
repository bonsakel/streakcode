import { Button } from '@/components/Button';
import { useProgress } from '@/store/progress';
import { Markdown } from './Markdown';

export function HintsPanel({ slug, hints }: { slug: string; hints: string[] }) {
  const revealed = useProgress((s) => s.hintsRevealed[slug] ?? 0);
  const revealHint = useProgress((s) => s.revealHint);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Stuck is fine. Hints go from gentle nudge to nearly the answer, and using them is tracked,
        so peek only as much as you need.
      </p>
      {hints.slice(0, revealed).map((hint, i) => (
        <div key={i} className="rounded-xl border border-line bg-raised/60 p-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-accent">Hint {i + 1}</p>
          <Markdown>{hint}</Markdown>
        </div>
      ))}
      {revealed < hints.length ? (
        <Button variant="secondary" size="sm" onClick={() => revealHint(slug, hints.length)}>
          {revealed === 0 ? 'Show me a hint' : `Show hint ${revealed + 1} of ${hints.length}`}
        </Button>
      ) : (
        <p className="text-sm text-muted">That's every hint. The rest is on you. You got this.</p>
      )}
    </div>
  );
}
