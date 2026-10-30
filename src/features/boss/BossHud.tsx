import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { getProblemMeta } from '@/features/problems';
import { Mascot } from '@/features/mascot/Mascot';
import { bossHp, currentStage, formatClock, timeLeftMs, type BossRun } from './engine';
import { BOSS_NAME } from './taunts';

export function BossHud({ run, now, taunt }: { run: BossRun; now: number; taunt: string | null }) {
  const hp = bossHp(run);
  const left = timeLeftMs(run, now);
  const urgent = !run.outcome && left < 5 * 60 * 1000;
  const stage = currentStage(run);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <Mascot
          mood={
            run.outcome === 'won'
              ? 'facepalm'
              : run.outcome === 'lost'
                ? 'celebrating'
                : hp <= 34
                  ? 'sleepy'
                  : 'thinking'
          }
          className="h-16 w-16 shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl">{BOSS_NAME}</h2>
            <span
              role="timer"
              aria-label="Time left"
              className={`font-mono text-2xl font-bold ${urgent ? 'text-bad' : ''}`}
            >
              {formatClock(left)}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Boss health"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hp}
            className="h-4 overflow-hidden rounded-full border border-line bg-raised"
          >
            <div
              className="h-full rounded-full bg-bad transition-[width] duration-700"
              style={{ width: `${hp}%` }}
            />
          </div>
          <p className="text-xs text-muted">{hp}% HP</p>
        </div>
      </div>
      {taunt && (
        <p className="rounded-xl bg-raised px-3 py-2 text-sm italic" aria-live="polite">
          “{taunt}”
        </p>
      )}
      <ol className="flex flex-wrap gap-2" aria-label="Stages">
        {run.slugs.map((slug, i) => {
          const meta = getProblemMeta(slug);
          const done = run.cleared.includes(slug);
          return (
            <li key={slug}>
              <Badge tint={done ? 'ok' : slug === stage ? 'accent' : 'neutral'}>
                {done ? '✓' : i + 1} {meta?.title ?? slug}
                {meta && <span className="opacity-70">· {meta.difficulty}</span>}
              </Badge>
            </li>
          );
        })}
      </ol>
      {stage && (
        <p className="sr-only">
          Current stage: {getProblemMeta(stage)?.title}, {getProblemMeta(stage)?.difficulty}
        </p>
      )}
    </Card>
  );
}
