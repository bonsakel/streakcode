import { useEffect, useRef, useState } from 'react';
import { cn } from '@/components/cn';
import { THEMES } from '@/features/theme/themes';
import { useSettings, type Tone } from '@/store/settings';

const TONES: Array<{ id: Tone; label: string }> = [
  { id: 'hype', label: 'Hype' },
  { id: 'roast', label: 'Roast' },
  { id: 'professional', label: 'Professional' },
];

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { theme, tone, soundOn, handle, setTheme, setTone, toggleSound, rerollHandle } =
    useSettings();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Sound effects on' : 'Sound effects off'}
        className="rounded-lg p-2 text-lg hover:bg-raised"
      >
        <span aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-1.5 text-sm font-semibold hover:border-accent/60"
      >
        <span aria-hidden="true">🎨</span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{handle}</span>
        <span className="sm:hidden">Settings</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 rounded-2xl border border-line bg-surface p-4 shadow-glow">
          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              Theme
            </legend>
            <div className="grid grid-cols-1 gap-1">
              {THEMES.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-accent',
                    theme === t.id ? 'bg-raised text-ink' : 'text-muted hover:bg-raised',
                  )}
                >
                  <input
                    type="radio"
                    name="theme"
                    className="sr-only"
                    checked={theme === t.id}
                    onChange={() => setTheme(t.id)}
                  />
                  <span aria-hidden="true">{t.emoji}</span>
                  <span className="flex-1">{t.label}</span>
                  <span aria-hidden="true" className="flex gap-1">
                    {t.swatch.map((c) => (
                      <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              Tone
            </legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-raised p-1">
              {TONES.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    'cursor-pointer rounded-lg px-1 py-1.5 text-center text-xs font-bold focus-within:outline focus-within:outline-2 focus-within:outline-accent',
                    tone === t.id ? 'bg-accent text-accent-fg' : 'text-muted hover:text-ink',
                  )}
                >
                  <input
                    type="radio"
                    name="tone"
                    className="sr-only"
                    checked={tone === t.id}
                    onChange={() => setTone(t.id)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
            <span className="truncate font-mono text-muted">{handle}</span>
            <button
              type="button"
              onClick={rerollHandle}
              className="font-bold text-accent hover:underline"
            >
              Reroll 🎲
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
