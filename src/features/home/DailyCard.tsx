import { Link } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HOME_COPY } from '@/features/copy/home';
import { dailySlug } from '@/features/gamification/daily';
import { dayKey } from '@/features/gamification/dates';
import { Mascot } from '@/features/mascot/Mascot';
import { getProblemMeta, listProblems } from '@/features/problems';
import { useProgress } from '@/store/progress';

const TINT = { easy: 'ok', medium: 'warn', hard: 'bad' } as const;

export function DailyCard() {
  const today = dayKey();
  const done = useProgress((s) => Boolean(s.dailyDone[today]));
  const slug = dailySlug(
    today,
    listProblems().map((p) => p.slug),
  );
  const meta = slug ? getProblemMeta(slug) : undefined;
  if (!meta) return null;

  return (
    <Card className="flex flex-wrap items-center gap-4">
      <Mascot mood={done ? 'celebrating' : 'idle'} className="h-16 w-16 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-muted">{HOME_COPY.dailyTitle}</p>
        <h3 className="text-2xl">{meta.title}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge tint={TINT[meta.difficulty]}>{meta.difficulty}</Badge>
          <Badge tint="accent">{meta.xp} XP</Badge>
          {done && <Badge tint="ok">✓ Done today</Badge>}
        </div>
      </div>
      <Link to="/daily">
        <Button variant="secondary">{done ? 'Revisit it' : 'Take the challenge'}</Button>
      </Link>
    </Card>
  );
}
