import { useRef, useState } from 'react';
import { Badge, type Tint } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getJudge } from '@/features/judge/browserJudge';
import type { Language, TestCase, TestResult, TestStatus, Verdict } from '@/features/judge/types';
import { computeVerdict } from '@/features/judge/verdict';

type LabLanguage = Exclude<Language, 'python'>;

const TESTS: TestCase[] = [
  { input: [1, 2], expected: 3 },
  { input: [-5, 5], expected: 0 },
  { input: [0.5, 0.25], expected: 0.75 },
  { input: [100, 200], expected: 300, hidden: true },
];

const SAMPLES: Record<LabLanguage, string> = {
  javascript: `function add(a, b) {
  console.log("adding", a, b);
  return a + b;
}
`,
  typescript: `function add(a: number, b: number): number {
  console.log("adding", a, b);
  return a + b;
}
`,
};

const LOOP: Record<LabLanguage, string> = {
  javascript: 'function add(a, b) {\n  while (true) {}\n}\n',
  typescript: 'function add(a: number, b: number): number {\n  while (true) {}\n}\n',
};

const STATUS_TINT: Record<TestStatus, Tint> = {
  passed: 'ok',
  wrong_answer: 'bad',
  runtime_error: 'bad',
  compile_error: 'bad',
  time_limit_exceeded: 'warn',
  skipped: 'neutral',
};

const STATUS_LABEL: Record<TestStatus, string> = {
  passed: 'Passed',
  wrong_answer: 'Wrong answer',
  runtime_error: 'Runtime error',
  compile_error: 'Compile error',
  time_limit_exceeded: 'Time limit exceeded',
  skipped: 'Skipped',
};

function ResultRow({ result }: { result: TestResult }) {
  return (
    <li className="rounded-xl border border-line bg-raised/60 p-3 text-sm">
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
        <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-x-2 gap-y-1 font-mono text-xs">
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
    </li>
  );
}

export default function JudgeLab() {
  const [language, setLanguage] = useState<LabLanguage>('javascript');
  const [code, setCode] = useState(SAMPLES.javascript);
  const [results, setResults] = useState<TestResult[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const run = async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setRunning(true);
    setResults([]);
    setVerdict(null);
    setFailure(null);
    const seen: TestResult[] = [];
    try {
      for await (const result of getJudge().runTests({
        language,
        code,
        fnName: 'add',
        tests: TESTS,
        timeLimitMs: 1000,
        epsilon: 1e-9,
        signal: abort.signal,
      })) {
        seen.push(result);
        setResults([...seen]);
      }
      setVerdict(computeVerdict(seen));
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setFailure(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (controller.current === abort) setRunning(false);
    }
  };

  const switchLanguage = (next: LabLanguage) => {
    setLanguage(next);
    setCode(SAMPLES[next]);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-4xl">Judge lab</h1>
      <p className="text-muted">
        A bare-bones page for poking the judge. Implement{' '}
        <code className="font-mono">add(a, b)</code>; it runs in a Web Worker with a 1 second limit.
      </p>
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold" htmlFor="lab-language">
            Language
          </label>
          <select
            id="lab-language"
            value={language}
            onChange={(e) => switchLanguage(e.target.value as LabLanguage)}
            className="rounded-lg border border-line bg-raised px-2 py-1.5 text-sm"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
          <Button size="sm" variant="ghost" onClick={() => setCode(LOOP[language])}>
            Load infinite loop
          </Button>
        </div>
        <label className="sr-only" htmlFor="lab-code">
          Solution code
        </label>
        <textarea
          id="lab-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={10}
          className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-sm"
        />
        <Button onClick={() => void run()} disabled={running}>
          {running ? 'Running...' : 'Run all tests'}
        </Button>
      </Card>

      {failure && (
        <p role="alert" className="text-bad">
          The judge itself broke: {failure}
        </p>
      )}
      {verdict && (
        <p role="status" className="font-display text-2xl font-extrabold">
          {verdict.kind.replaceAll('_', ' ')} · {verdict.passed}/{verdict.total} passed
        </p>
      )}
      <ul className="space-y-2" aria-label="Test results">
        {results.map((r) => (
          <ResultRow key={r.index} result={r} />
        ))}
      </ul>
    </div>
  );
}
