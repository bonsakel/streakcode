import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { NAV_LINKS } from '@/app/navLinks';
import { THEMES } from '@/features/theme/themes';
import { listProblems } from '@/features/problems';
import { useSettings, type Tone } from '@/store/settings';
import { filterCommands, type Command } from './commands';
import { usePalette } from './paletteStore';

const TONE_LABEL: Record<Tone, string> = {
  hype: 'Hype',
  roast: 'Roast',
  professional: 'Professional',
};

function useCommands(close: () => void): Command[] {
  const navigate = useNavigate();
  const soundOn = useSettings((s) => s.soundOn);
  const setTheme = useSettings((s) => s.setTheme);
  const setTone = useSettings((s) => s.setTone);
  const toggleSound = useSettings((s) => s.toggleSound);

  return useMemo(() => {
    const go = (to: string) => () => {
      close();
      navigate(to);
    };
    const act = (fn: () => void) => () => {
      fn();
      close();
    };
    const problems = listProblems();
    return [
      ...NAV_LINKS.map((l) => ({
        id: `go:${l.to}`,
        title: l.label,
        group: 'Go to' as const,
        run: go(l.to),
      })),
      {
        id: 'surprise',
        title: 'Surprise me with a problem',
        group: 'Problems' as const,
        keywords: 'random',
        run: () => {
          const pick = problems[Math.floor(Math.random() * problems.length)];
          if (pick) go(`/problem/${pick.slug}`)();
        },
      },
      ...problems.map((p) => ({
        id: `problem:${p.slug}`,
        title: p.title,
        group: 'Problems' as const,
        keywords: `${p.difficulty} ${p.tags.join(' ').replaceAll('-', ' ')}`,
        hint: p.difficulty,
        run: go(`/problem/${p.slug}`),
      })),
      ...THEMES.map((t) => ({
        id: `theme:${t.id}`,
        title: `Theme: ${t.label}`,
        group: 'Theme' as const,
        keywords: 'color appearance',
        run: act(() => setTheme(t.id)),
      })),
      ...(Object.keys(TONE_LABEL) as Tone[]).map((tone) => ({
        id: `tone:${tone}`,
        title: `Tone: ${TONE_LABEL[tone]}`,
        group: 'Tone' as const,
        keywords: 'verdict voice jokes',
        run: act(() => setTone(tone)),
      })),
      {
        id: 'sound',
        title: soundOn ? 'Turn sound off' : 'Turn sound on',
        group: 'Settings' as const,
        keywords: 'audio mute volume',
        run: act(toggleSound),
      },
    ];
  }, [close, navigate, soundOn, setTheme, setTone, toggleSound]);
}

function PaletteBody({ close }: { close: () => void }) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const commands = useCommands(close);
  const results = useMemo(() => filterCommands(commands, query).slice(0, 40), [commands, query]);
  const index = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    document.getElementById(`${listId}-${index}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [index, listId]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((index + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((index - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[index]?.run();
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      <input
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={results.length ? `${listId}-${index}` : undefined}
        aria-label="Search commands"
        placeholder="Jump to a problem, switch theme or tone..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        className="mb-3 h-11 w-full rounded-xl border border-line bg-raised px-3 text-ink placeholder:text-muted focus:border-accent"
      />
      <ul id={listId} role="listbox" aria-label="Commands" className="max-h-72 overflow-auto">
        {results.map((c, i) => (
          <li
            key={c.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === index}
            onMouseMove={() => setActive(i)}
            onClick={c.run}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
              i === index ? 'bg-accent/15 text-ink' : 'text-muted'
            }`}
          >
            <span className="truncate font-semibold">{c.title}</span>
            <span className="shrink-0 text-xs opacity-70">{c.hint ?? c.group}</span>
          </li>
        ))}
        {results.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted">
            Nothing matches "{query}". Blobert checked twice. 🫥
          </li>
        )}
      </ul>
      <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
        ↑↓ to move · Enter to pick · Esc to close · In the editor: Ctrl/⌘+Enter runs,
        Ctrl/⌘+Shift+Enter submits
      </p>
    </div>
  );
}

export function CommandPalette() {
  const open = usePalette((s) => s.open);
  const setOpen = usePalette((s) => s.setOpen);
  const close = useMemo(() => () => setOpen(false), [setOpen]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        usePalette.getState().toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Modal open={open} onClose={close} title="Command palette" wide>
      <PaletteBody close={close} />
    </Modal>
  );
}
