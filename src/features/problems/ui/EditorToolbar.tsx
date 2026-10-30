import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { LANGUAGE_LABEL } from '@/features/judge/statusUi';
import type { Language } from '@/features/judge/types';

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python'];

function useElapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

interface EditorToolbarProps {
  language: Language;
  onLanguage: (language: Language) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  running: boolean;
}

export function EditorToolbar({
  language,
  onLanguage,
  onRun,
  onSubmit,
  onReset,
  running,
}: EditorToolbarProps) {
  const elapsed = useElapsed();
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line p-2">
      <label className="sr-only" htmlFor="language">
        Language
      </label>
      <select
        id="language"
        value={language}
        onChange={(e) => onLanguage(e.target.value as Language)}
        className="rounded-lg border border-line bg-raised px-2 py-1.5 text-sm"
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {LANGUAGE_LABEL[l]}
          </option>
        ))}
      </select>
      <Button size="sm" variant="ghost" onClick={onReset} disabled={running}>
        Reset code
      </Button>
      <Badge className="font-mono" title="Time on this page">
        ⏱ {elapsed}
      </Badge>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="secondary" onClick={onRun} disabled={running}>
          Run
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={running}>
          Submit
        </Button>
      </div>
    </div>
  );
}
