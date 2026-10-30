import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { runtimeProgressText } from '@/features/copy/runtime';
import type { RuntimeProgress } from '@/features/judge/protocol';
import { STATUS_LABEL, STATUS_TINT, VERDICT_LABEL, VERDICT_TINT } from '@/features/judge/statusUi';
import type { Language, TestResult, Verdict } from '@/features/judge/types';
import { Mascot } from '@/features/mascot/Mascot';
import { moodForVerdict } from '@/features/mascot/mood';

export type RunMode = 'run' | 'submit';

interface ResultsPanelProps {
  mode: RunMode | null;
  language: Language;
  results: TestResult[];
  verdict: Verdict | null;
  running: boolean;
  progress: RuntimeProgress | null;
  failure: string | null;
  /** Tone-aware line shown next to the mascot once a verdict is in. */
  message: string | null;
  /** Offered after an accepted submission. */
  onShare?: () => void;
}

function ResultRow({ result, delay }: { result: TestResult; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="rounded-xl border border-line bg-raised/60 p-3 text-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tint={STATUS_TINT[result.status]}>{STATUS_LABEL[result.status]}</Badge>
        <span className="font-semibold">
          {result.hidden ? `Hidden test #${result.index + 1}` : `Test #${result.index + 1}`}
        </span>
        {result.timeMs !== null && (
          <span className="ml-auto font-mono text-muted">{result.timeMs.toFixed(2)} ms</span>
        )}
      </div>
      {!result.hidden && result.input !== undefined && (
        <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-x-2 gap-y-1 break-all font-mono text-xs">
          <dt className="text-muted">input</dt>
          <dd>{result.input}</dd>
          <dt className="text-muted">expected</dt>
          <dd>{result.expected}</dd>
          {result.got !== undefined && (
            <>
              <dt className="text-muted">got</dt>
              <dd>{result.got}</dd>
            </>
          )}
        </dl>
      )}
      {result.error && (
        <p className="mt-2 font-mono text-xs text-bad">
          {result.error.name}: {result.error.message}
          {result.error.line !== undefined && ` (line ${result.error.line})`}
        </p>
      )}
      {result.stdout && (
        <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-bg p-2 font-mono text-xs">
          {result.stdout}
          {result.stdoutTruncated && '… (output truncated)'}
        </pre>
      )}
    </motion.li>
  );
}

export function ResultsPanel({
  mode,
  language,
  results,
  verdict,
  running,
  progress,
  failure,
  message,
  onShare,
}: ResultsPanelProps) {
  if (!mode && !running) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Mascot mood="idle" className="h-14 w-14 shrink-0" />
        <p className="text-sm text-muted">
          Hit <strong>Run</strong> to try the visible tests, or <strong>Submit</strong> to face the
          hidden ones too. (Ctrl/⌘ + Enter runs, Ctrl/⌘ + Shift + Enter submits.)
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3 p-4" aria-live="polite">
      {running && progress && progress.stage !== 'ready' && (
        <p role="status" className="text-sm text-muted">
          {runtimeProgressText(language, progress)}
        </p>
      )}
      {running && !(progress && progress.stage !== 'ready') && (
        <p role="status" className="text-sm text-muted">
          Judging... {results.length} test{results.length === 1 ? '' : 's'} in.
        </p>
      )}
      {(verdict || running) && (
        <div className="flex items-center gap-3">
          <Mascot
            mood={moodForVerdict(verdict?.kind ?? null, running)}
            className="h-14 w-14 shrink-0"
          />
          {verdict && (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tint={VERDICT_TINT[verdict.kind]} className="px-3 py-1 text-base">
                  {VERDICT_LABEL[verdict.kind]}
                </Badge>
                <span className="font-mono text-sm text-muted">
                  {verdict.passed}/{verdict.total} passed
                  {mode === 'run' ? ' (visible tests only)' : ''}
                </span>
              </div>
              {message && <p className="text-sm font-semibold">{message}</p>}
              {onShare && mode === 'submit' && verdict.kind === 'accepted' && (
                <Button size="sm" variant="secondary" onClick={onShare}>
                  📸 Share result
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {failure && (
        <p role="alert" className="text-sm text-bad">
          The judge hit a snag: {failure}
        </p>
      )}
      <ul className="space-y-2">
        {results.map((r, i) => (
          <ResultRow key={`${mode}-${r.index}`} result={r} delay={Math.min(i, 12) * 0.08} />
        ))}
      </ul>
    </div>
  );
}
