import { Card } from '@/components/Card';
import { listProblems } from '@/features/problems';
import { useProgress } from '@/store/progress';

const BAR = { easy: 'bg-ok', medium: 'bg-warn', hard: 'bg-bad' } as const;

export function DifficultyStats() {
  const solved = useProgress((s) => s.solved);
  const problems = listProblems();
  return (
    <Card className="space-y-3">
      <h2 className="text-xl">Solved by difficulty</h2>
      {(['easy', 'medium', 'hard'] as const).map((d) => {
        const all = problems.filter((p) => p.difficulty === d);
        const done = all.filter((p) => solved[p.slug]).length;
        const pct = all.length ? (done / all.length) * 100 : 0;
        return (
          <div key={d}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="capitalize">{d}</span>
              <span className="font-mono text-muted">
                {done}/{all.length}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${d} problems solved`}
              aria-valuemin={0}
              aria-valuemax={all.length}
              aria-valuenow={done}
              className="h-2.5 overflow-hidden rounded-full bg-raised"
            >
              <div className={`h-full rounded-full ${BAR[d]}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
