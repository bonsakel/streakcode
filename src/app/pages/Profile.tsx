import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { dayKey } from '@/features/gamification/dates';
import { AchievementGrid } from '@/features/profile/AchievementGrid';
import { DataControls } from '@/features/profile/DataControls';
import { DifficultyStats } from '@/features/profile/DifficultyStats';
import { Heatmap } from '@/features/profile/Heatmap';
import { LevelCard } from '@/features/profile/LevelCard';
import { streakOf, totalXp, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

export default function Profile() {
  const handle = useSettings((s) => s.handle);
  const rerollHandle = useSettings((s) => s.rerollHandle);
  const progress = useProgress();
  const streak = streakOf(progress);
  const solvedCount = Object.keys(progress.solved).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Profile <span className="font-normal normal-case">(only you can see it)</span>
          </h1>
          <p className="font-display text-4xl font-bold">{handle}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={rerollHandle}>
          🎲 Reroll handle
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <LevelCard xp={totalXp(progress)} streak={streak} />
        <DifficultyStats />
      </div>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Activity</h2>
          <span className="text-sm text-muted">{solvedCount} solved</span>
        </div>
        <Heatmap activity={progress.activity} today={dayKey()} />
      </Card>

      <AchievementGrid unlocked={progress.achievements} />
      <DataControls />
    </div>
  );
}
