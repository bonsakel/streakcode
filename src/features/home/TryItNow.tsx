import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HOME_COPY } from '@/features/copy/home';
import { loadProblem, listProblems } from '@/features/problems';
import type { Problem } from '@/features/problems/parseProblem';
import { useJudgeRun } from '@/features/problems/useJudgeRun';
import { ResultsPanel } from '@/features/problems/ui/ResultsPanel';

const CodeEditor = lazy(() => import('@/features/editor/CodeEditor'));

const FEATURED = 'left-on-read';
const DEMO_SOLUTION = `function leftOnRead(sent, replied) {
  const answered = new Set(replied);
  return sent.find((id) => !answered.has(id)) ?? -1;
}`;

function pickSlug(): string | undefined {
  const all = listProblems();
  return (all.find((p) => p.slug === FEATURED) ?? all.find((p) => p.difficulty === 'easy'))?.slug;
}

/** True once the element enters the viewport, so Monaco is not fetched for a hero-only visit. */
function useNearViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, near };
}

/** A tiny live judge: JavaScript only, visible tests only, and it never touches your progress. */
export function TryItNow() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState(DEMO_SOLUTION);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { ref, near } = useNearViewport();
  const { state, start } = useJudgeRun(problem, () => undefined);

  useEffect(() => {
    const slug = pickSlug();
    if (!slug) return;
    let live = true;
    void loadProblem(slug)
      .then((p) => {
        if (live) setProblem(p);
      })
      .catch((error: unknown) => {
        if (live) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <section ref={ref} aria-labelledby="try-it" className="space-y-4">
      <div className="max-w-2xl space-y-1">
        <h2 id="try-it" className="text-3xl sm:text-4xl">
          {HOME_COPY.tryTitle}
        </h2>
        <p className="text-muted">{HOME_COPY.tryBody}</p>
      </div>
      <Card className="overflow-hidden p-0">
        {loadError && (
          <p role="alert" className="border-b border-line p-4 text-sm text-bad">
            Could not load the sample challenge: {loadError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <strong>{problem?.title ?? 'Loading...'}</strong>
            {problem && <Badge tint="ok">{problem.difficulty}</Badge>}
            <Badge>JavaScript</Badge>
          </div>
          <Button
            size="sm"
            disabled={!problem || state.running}
            onClick={() => void start('run', 'javascript', code)}
          >
            {state.running ? 'Running...' : 'Run'}
          </Button>
        </div>
        {problem && (
          <p className="border-b border-line px-4 py-2 text-sm text-muted">{problem.flavor}</p>
        )}
        <div className="h-56">
          {near && problem ? (
            <Suspense fallback={<StaticCode code={code} />}>
              <CodeEditor
                value={code}
                language="javascript"
                onChange={setCode}
                onRun={() => void start('run', 'javascript', code)}
                onSubmit={() => void start('run', 'javascript', code)}
                errorLine={
                  state.results.find((r) => r.error?.line !== undefined)?.error?.line ?? null
                }
                label="Try it now: solution code"
              />
            </Suspense>
          ) : (
            <StaticCode code={code} />
          )}
        </div>
        <div className="max-h-72 overflow-auto border-t border-line">
          <ResultsPanel
            mode={state.mode}
            language="javascript"
            results={state.results}
            verdict={state.verdict}
            running={state.running}
            progress={state.progress}
            failure={state.failure}
            message={null}
            onShare={() => undefined}
          />
        </div>
      </Card>
    </section>
  );
}

function StaticCode({ code }: { code: string }) {
  return (
    <pre className="h-full overflow-auto p-4 font-mono text-sm text-muted" aria-hidden="true">
      {code}
    </pre>
  );
}
