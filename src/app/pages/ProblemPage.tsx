import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tabs } from '@/components/Tabs';
import { playSound } from '@/features/effects/sound';
import { Mascot } from '@/features/mascot/Mascot';
import { VERDICT_LABEL } from '@/features/judge/statusUi';
import type { Language } from '@/features/judge/types';
import { getProblemMeta, loadProblem } from '@/features/problems';
import type { Problem } from '@/features/problems/parseProblem';
import { useJudgeRun } from '@/features/problems/useJudgeRun';
import { useRunReaction } from '@/features/problems/useRunReaction';
import { useProgress } from '@/store/progress';
import { EditorToolbar } from '@/features/problems/ui/EditorToolbar';
import { HintsPanel } from '@/features/problems/ui/HintsPanel';
import { Markdown } from '@/features/problems/ui/Markdown';
import { ResultsPanel, type RunMode } from '@/features/problems/ui/ResultsPanel';
import { EditorialPanel, SubmissionsPanel } from '@/features/problems/ui/SidePanels';
import { SplitPane } from '@/features/problems/ui/SplitPane';
import { draftKey, useWorkspace } from '@/store/workspace';

const CodeEditor = lazy(() => import('@/features/editor/CodeEditor'));

const DIFFICULTY_TINT = { easy: 'ok', medium: 'warn', hard: 'bad' } as const;
const TABS = [
  { id: 'statement', label: 'Statement' },
  { id: 'hints', label: 'Hints' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'submissions', label: 'My submissions' },
];

function NotFound({ slug }: { slug: string }) {
  return (
    <Card className="mx-auto max-w-lg space-y-3 text-center">
      <p className="text-5xl" aria-hidden="true">
        🫥
      </p>
      <h1 className="text-3xl">No problem called "{slug}"</h1>
      <p className="text-muted">
        Maybe the link is old, or it got yeeted. The list has the real ones.
      </p>
      <Link to="/problems">
        <Button>Browse problems</Button>
      </Link>
    </Card>
  );
}

function Workbench({ problem }: { problem: Problem }) {
  const { slug } = problem;
  const language = useWorkspace((s) => s.language);
  const setLanguage = useWorkspace((s) => s.setLanguage);
  const splitPct = useWorkspace((s) => s.splitPct);
  const setSplitPct = useWorkspace((s) => s.setSplitPct);
  const setDraft = useWorkspace((s) => s.setDraft);
  const clearDraft = useWorkspace((s) => s.clearDraft);
  const solved = useProgress((s) => Boolean(s.solved[slug]));

  const [tab, setTab] = useState('statement');
  const [code, setCode] = useState(
    () => useWorkspace.getState().drafts[draftKey(slug, language)] ?? problem.starters[language],
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { message, onFinished } = useRunReaction(slug);
  const { state, start, reset } = useJudgeRun(problem, onFinished);

  const errorLine = useMemo(
    () => state.results.find((r) => r.error?.line !== undefined)?.error?.line ?? null,
    [state.results],
  );

  const flushDraft = () => {
    clearTimeout(draftTimer.current);
    setDraft(slug, language, code);
  };

  const switchLanguage = (next: Language) => {
    flushDraft();
    setLanguage(next);
    setCode(useWorkspace.getState().drafts[draftKey(slug, next)] ?? problem.starters[next]);
    reset();
  };

  const onCode = useCallback(
    (next: string) => {
      setCode(next);
      clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => setDraft(slug, language, next), 300);
    },
    [slug, language, setDraft],
  );

  useEffect(() => () => clearTimeout(draftTimer.current), []);

  const run = (mode: RunMode) => {
    playSound('run');
    void start(mode, language, code);
  };
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });
  const onShortcut = useCallback(() => runRef.current('run'), []);
  const onSubmitShortcut = useCallback(() => runRef.current('submit'), []);

  const resetCode = () => {
    if (!window.confirm('Reset to the starter code? Your current code will be lost.')) return;
    clearTimeout(draftTimer.current);
    clearDraft(slug, language);
    setCode(problem.starters[language]);
    reset();
  };

  const left = (
    <Card className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl">{problem.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tint={DIFFICULTY_TINT[problem.difficulty]}>{problem.difficulty}</Badge>
          <Badge tint="accent">{problem.xp} XP</Badge>
          {solved && <Badge tint="ok">✓ Solved</Badge>}
          {problem.tags.map((t) => (
            <Badge key={t}>{t.replaceAll('-', ' ')}</Badge>
          ))}
        </div>
      </div>
      <Tabs items={TABS} value={tab} onChange={setTab} label="Problem sections" />
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        {tab === 'statement' && <Markdown>{problem.statement}</Markdown>}
        {tab === 'hints' && <HintsPanel slug={slug} hints={problem.hints} />}
        {tab === 'editorial' && <EditorialPanel slug={slug} editorial={problem.editorial} />}
        {tab === 'submissions' && (
          <SubmissionsPanel
            slug={slug}
            onLoad={(lang, src) => {
              setLanguage(lang);
              setCode(src);
              setDraft(slug, lang, src);
            }}
          />
        )}
      </div>
    </Card>
  );

  const verdictLabel = state.verdict ? ` · ${VERDICT_LABEL[state.verdict.kind]}` : '';
  const right = (
    <div className="space-y-3">
      <Card className="overflow-hidden p-0">
        <EditorToolbar
          language={language}
          onLanguage={switchLanguage}
          onRun={() => run('run')}
          onSubmit={() => run('submit')}
          onReset={resetCode}
          running={state.running}
        />
        <div className="h-[24rem] lg:h-[28rem]">
          <Suspense fallback={<p className="p-4 text-sm text-muted">Booting the editor...</p>}>
            <CodeEditor
              value={code}
              language={language}
              onChange={onCode}
              onRun={onShortcut}
              onSubmit={onSubmitShortcut}
              errorLine={errorLine}
              label={`${problem.title} solution`}
            />
          </Suspense>
        </div>
      </Card>
      <Card className="p-0">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-bold"
        >
          <span>Results{verdictLabel}</span>
          <span aria-hidden="true">{panelOpen ? '▾' : '▸'}</span>
        </button>
        {panelOpen && (
          <div className="max-h-[22rem] overflow-auto border-t border-line">
            <ResultsPanel
              mode={state.mode}
              language={language}
              results={state.results}
              verdict={state.verdict}
              running={state.running}
              progress={state.progress}
              failure={state.failure}
              message={message}
            />
          </div>
        )}
      </Card>
    </div>
  );

  return <SplitPane left={left} right={right} pct={splitPct} onChange={setSplitPct} />;
}

function ProblemLoader({ slug }: { slug: string }) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadProblem(slug)
      .then((p) => live && setProblem(p))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [slug]);

  if (failed) {
    return <p role="alert">Couldn't load this problem. Check your connection and refresh.</p>;
  }
  if (!problem)
    return (
      <div className="flex items-center gap-3 text-muted">
        <Mascot mood="thinking" className="h-12 w-12" />
        <p>Fetching the problem... plotting something.</p>
      </div>
    );
  return <Workbench problem={problem} />;
}

export default function ProblemPage() {
  const { slug = '' } = useParams();
  if (!getProblemMeta(slug)) return <NotFound slug={slug} />;
  return <ProblemLoader key={slug} slug={slug} />;
}
