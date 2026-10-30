import { Card } from '@/components/Card';
import { cn } from '@/components/cn';
import { ACHIEVEMENTS } from '@/features/gamification/achievements';

export function AchievementGrid({ unlocked }: { unlocked: Record<string, number> }) {
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl">Achievements</h2>
        <span className="text-sm text-muted">
          {count}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id];
          return (
            <li
              key={a.id}
              className={cn(
                'flex gap-3 rounded-xl border p-3',
                at ? 'border-accent/50 bg-accent/10' : 'border-line opacity-60',
              )}
            >
              <span aria-hidden="true" className={cn('text-2xl', !at && 'grayscale')}>
                {at ? a.icon : '🔒'}
              </span>
              <div className="min-w-0">
                <p className="font-bold leading-tight">{a.title}</p>
                <p className="text-xs text-muted">{a.description}</p>
                {at && (
                  <p className="mt-1 text-xs text-accent">
                    Unlocked {new Date(at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
