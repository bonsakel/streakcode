import { useEffect, useState } from 'react';
import type { VerdictKind } from '@/features/judge/types';
import { loadProblem } from '@/features/problems';
import type { Problem } from '@/features/problems/parseProblem';
import { Mascot } from '@/features/mascot/Mascot';
import { Workbench } from './Workbench';

export function ProblemLoader({
  slug,
  onSubmitted,
}: {
  slug: string;
  onSubmitted?: (slug: string, verdict: VerdictKind) => void;
}) {
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
  return <Workbench problem={problem} onSubmitted={onSubmitted} />;
}
