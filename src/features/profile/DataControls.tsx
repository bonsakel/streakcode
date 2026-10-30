import { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { toast } from '@/components/toastStore';
import { exportProgress, importProgress } from '@/features/gamification/progressIO';
import { useProgress } from '@/store/progress';

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataControls() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const reset = useProgress((s) => s.reset);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > 5_000_000) {
      setError('That file is huge. Skill Issue exports are much smaller.');
      return;
    }
    const result = importProgress(await file.text());
    if (result.ok) toast(`Imported! ${result.solved} solved problems restored. 📦`, 'success');
    else setError(result.error);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onReset = () => {
    if (!window.confirm('Erase all progress, XP, streaks and achievements? This cannot be undone.'))
      return;
    reset();
    toast('Fresh start. Blobert has questions but respects it.', 'info');
  };

  return (
    <Card className="space-y-3">
      <h2 className="text-xl">Your data</h2>
      <p className="text-sm text-muted">
        Everything lives in this browser. No account, no server. Export it to back it up or move to
        another device.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => download(`skill-issue-progress-${Date.now()}.json`, exportProgress())}
        >
          Export progress
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          Import progress
        </Button>
        <Button variant="danger" onClick={onReset}>
          Reset
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import progress file"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
    </Card>
  );
}
