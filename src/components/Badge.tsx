import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type Tint = 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';

const tints: Record<Tint, string> = {
  neutral: 'border-line text-muted',
  ok: 'border-ok/50 bg-ok/10 text-ok',
  warn: 'border-warn/50 bg-warn/10 text-warn',
  bad: 'border-bad/50 bg-bad/10 text-bad',
  accent: 'border-accent/50 bg-accent/10 text-accent',
};

export function Badge({
  tint = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tint?: Tint }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        tints[tint],
        className,
      )}
      {...rest}
    />
  );
}
