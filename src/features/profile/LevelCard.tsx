import { Card } from '@/components/Card';
import { levelFor } from '@/features/gamification/levels';
import type { StreakInfo } from '@/features/gamification/streak';
import { Mascot } from '@/features/mascot/Mascot';

export function LevelCard({ xp, streak }: { xp: number; streak: StreakInfo }) {
  const level = levelFor(xp);
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <Mascot mood={level.index >= 3 ? 'celebrating' : 'idle'} className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-muted">Level {level.index + 1}</p>
          <p className="font-display text-2xl font-bold leading-tight">{level.title}</p>
          <p className="font-mono text-sm text-muted">{xp.toLocaleString()} XP</p>
        </div>
      </div>
      <div>
        <div
          role="progressbar"
          aria-label="Progress to next level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level.progress * 100)}
          className="h-3 overflow-hidden rounded-full bg-raised"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${Math.round(level.progress * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          {level.xpForNext === null
            ? 'Max level. There is nowhere left to go but up, somehow.'
            : `${level.xpIntoLevel} / ${level.xpForNext} XP to the next level`}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Streak" value={`${streak.current}🔥`} />
        <Stat label="Best" value={String(streak.longest)} />
        <Stat label="Freezes" value={`${streak.freezes}🧊`} />
      </dl>
      {streak.atRisk && (
        <p className="text-sm text-warn">
          Your {streak.current}-day streak is waiting for a solve today.
        </p>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line p-2">
      <dd className="text-lg font-bold">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}
