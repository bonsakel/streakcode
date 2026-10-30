import { useCallback, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { MAX_SPLIT, MIN_SPLIT } from '@/store/workspace';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  /** Width of the left pane in percent (applies from the lg breakpoint up). */
  pct: number;
  onChange: (pct: number) => void;
}

/** Two panes with a draggable, keyboard-operable divider. Stacks vertically on small screens. */
export function SplitPane({ left, right, pct, onChange }: SplitPaneProps) {
  const container = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId) || !container.current) return;
      const rect = container.current.getBoundingClientRect();
      onChange(((e.clientX - rect.left) / rect.width) * 100);
    },
    [onChange],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 3;
    if (e.key === 'ArrowLeft') onChange(pct - step);
    else if (e.key === 'ArrowRight') onChange(pct + step);
    else if (e.key === 'Home') onChange(MIN_SPLIT);
    else if (e.key === 'End') onChange(MAX_SPLIT);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={container}
      className="flex flex-col gap-4 lg:flex-row lg:gap-0"
      style={{ '--split': `${pct}%` } as React.CSSProperties}
    >
      <div className="min-w-0 lg:w-[var(--split)] lg:shrink-0 lg:pr-2">{left}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={MIN_SPLIT}
        aria-valuemax={MAX_SPLIT}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="group hidden w-3 shrink-0 cursor-col-resize touch-none items-stretch justify-center rounded focus-visible:outline-accent lg:flex"
      >
        <span className="my-2 w-1 rounded-full bg-line transition group-hover:bg-accent group-focus-visible:bg-accent" />
      </div>
      <div className="min-w-0 flex-1 lg:pl-2">{right}</div>
    </div>
  );
}
