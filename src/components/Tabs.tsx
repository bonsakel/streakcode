import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
  /** Shared ID prefix for the matching tab panel. */
  idBase?: string;
}

/** Accessible tablist with roving focus. */
export function Tabs({ items, value, onChange, label, className, idBase }: TabsProps) {
  const generated = useId();
  const base = idBase ?? generated;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = items.filter((i) => !i.disabled);

  const onKeyDown = (e: KeyboardEvent) => {
    const current = enabled.findIndex((i) => i.id === value);
    let next: number;
    if (e.key === 'ArrowRight') next = (current + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    else return;
    e.preventDefault();
    const target = enabled[next];
    if (!target) return;
    onChange(target.id);
    refs.current[items.indexOf(target)]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex flex-wrap gap-1', className)}
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-40',
              selected ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-raised hover:text-ink',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
