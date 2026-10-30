import { Link } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { dailySlug } from '@/features/gamification/daily';
import { dayKey } from '@/features/gamification/dates';
import { dailyBonus } from '@/features/gamification/xp';
import { Mascot } from '@/features/mascot/Mascot';
import { getProblemMeta, listProblems } from '@/features/problems';
import { streakOf, useProgress } from '@/store/progress';

const TINT = { easy: 'ok', medium: 'warn', hard: 'bad' } as const;

export default function Daily() {
  const today = dayKey();
  const progress = useProgress();
  const slug = dailySlug(
    today,
    listProblems().map((p) => p.slug),
  );
  const meta = slug ? getProblemMeta(slug) : undefined;
  const streak = streakOf(progress);
  const done = Boolean(progress.dailyDone[today]);
  const bonus = dailyBonus(streak.current + (streak.doneToday ? 0 : 1));

  if (!meta) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl">No daily today</h1>
        <p className="text-muted">There are no problems yet. Check back soon.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
        </p>
        <h1 className="text-4xl">Daily Challenge</h1>
      </header>

      <Card className="space-y-4">
        <div className="flex items-start gap-4">
          <Mascot mood={done ? 'celebrating' : 'idle'} className="h-16 w-16 shrink-0" />
          <div className="space-y-2">
            <h2 className="text-2xl">{meta.title}</h2>
            <p className="text-muted">{meta.flavor}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tint={TINT[meta.difficulty]}>{meta.difficulty}</Badge>
              <Badge tint="accent">{meta.xp} XP</Badge>
              <Badge tint="warn">+{bonus} daily bonus</Badge>
              {done && <Badge tint="ok">✓ Done today</Badge>}
            </div>
          </div>
        </div>
        <Link to={`/problem/${meta.slug}`}>
          <Button size="lg">{done ? 'Revisit it' : 'Start cooking'}</Button>
        </Link>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <strong>{streak.current}🔥</strong> day streak · best {streak.longest} · {streak.freezes}
          🧊 freezes
        </p>
        <p className="text-sm text-muted">
          {streak.doneToday
            ? 'Streak extended today. Nice.'
            : 'Solve anything today to keep your streak. A freeze token covers a missed day.'}
        </p>
      </Card>
      <p className="text-center text-sm text-muted">
        A new problem appears at your local midnight. No server involved.
      </p>
    </div>
  );
}
