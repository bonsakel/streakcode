import { addDays, dayDiff, dayKey, parseDayKey } from '@/features/gamification/dates';
import { cn } from '@/components/cn';

const WEEKS = 26;

const SHADES = ['bg-raised', 'bg-accent/30', 'bg-accent/55', 'bg-accent/80', 'bg-accent'] as const;

const shade = (n: number) => SHADES[Math.min(n, SHADES.length - 1)]!;

/** Last ~6 months of accepted submissions, one square per local day. */
export function Heatmap({
  activity,
  today = dayKey(),
}: {
  activity: Record<string, number>;
  today?: string;
}) {
  const todayDow = parseDayKey(today).getDay();
  const start = addDays(today, -(todayDow + (WEEKS - 1) * 7));
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(start, i));
  const active = Object.entries(activity).filter(([d]) => dayDiff(start, d) >= 0).length;

  return (
    <div>
      <div
        role="img"
        aria-label={`Activity heatmap: ${active} active days in the last ${WEEKS} weeks`}
        className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
        style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
      >
        {cells.map((day) => {
          const future = dayDiff(today, day) > 0;
          const n = activity[day] ?? 0;
          return (
            <div
              key={day}
              title={future ? undefined : `${day}: ${n} accepted`}
              className={cn(
                'h-3 w-3 rounded-[3px]',
                future ? 'opacity-0' : shade(n),
                day === today && 'ring-1 ring-pop',
              )}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
        Less
        {SHADES.map((s) => (
          <span key={s} className={cn('h-3 w-3 rounded-[3px]', s)} />
        ))}
        More
      </div>
    </div>
  );
}
