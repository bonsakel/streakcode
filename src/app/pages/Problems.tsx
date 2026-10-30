import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { listProblems } from '@/features/problems';
import {
  allTags,
  DEFAULT_FILTERS,
  filterProblems,
  humanizeTag,
  pickRandom,
  type ProblemFilters,
} from '@/features/problems/filters';
import { useProgress } from '@/store/progress';

const TINT = { easy: 'ok', medium: 'warn', hard: 'bad' } as const;
const field = 'rounded-xl border border-line bg-raised px-3 py-2 text-sm';

function ProgressRing({ solved, total }: { solved: number; total: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const fraction = total === 0 ? 0 : solved / total;
  return (
    <div
      className="relative h-16 w-16"
      role="img"
      aria-label={`${solved} of ${total} problems solved`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-line" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-accent transition-[stroke-dashoffset] duration-700"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
        {solved}/{total}
      </span>
    </div>
  );
}

export default function Problems() {
  const problems = listProblems();
  const solvedMap = useProgress((s) => s.solved);
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProblemFilters>(DEFAULT_FILTERS);
  const isSolved = (slug: string) => solvedMap[slug] !== undefined;
  const tags = useMemo(() => allTags(problems), [problems]);
  const visible = filterProblems(problems, filters, isSolved);
  const solvedCount = problems.filter((p) => isSolved(p.slug)).length;
  const set = <K extends keyof ProblemFilters>(key: K, value: ProblemFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const surprise = () => {
    const pick = pickRandom(problems, isSolved);
    if (pick) navigate(`/problem/${pick.slug}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <ProgressRing solved={solvedCount} total={problems.length} />
        <div>
          <h1 className="text-4xl">Problems</h1>
          <p className="text-muted">Pick your fighter. Every one runs right in your browser.</p>
        </div>
        <Button className="ml-auto" onClick={surprise}>
          🎲 Surprise me
        </Button>
      </header>

      <div className="flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="q">
          Search problems
        </label>
        <input
          id="q"
          type="search"
          placeholder="Search problems..."
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
          className={`${field} min-w-[12rem] flex-1`}
        />
        <label className="sr-only" htmlFor="difficulty">
          Difficulty
        </label>
        <select
          id="difficulty"
          value={filters.difficulty}
          onChange={(e) => set('difficulty', e.target.value as ProblemFilters['difficulty'])}
          className={field}
        >
          <option value="all">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <label className="sr-only" htmlFor="tag">
          Topic
        </label>
        <select
          id="tag"
          value={filters.tag}
          onChange={(e) => set('tag', e.target.value)}
          className={field}
        >
          <option value="all">Any topic</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {humanizeTag(t)}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="solved">
          Status
        </label>
        <select
          id="solved"
          value={filters.solved}
          onChange={(e) => set('solved', e.target.value as ProblemFilters['solved'])}
          className={field}
        >
          <option value="all">Any status</option>
          <option value="unsolved">Unsolved</option>
          <option value="solved">Solved</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <Card className="space-y-3 text-center">
          <p className="text-4xl" aria-hidden="true">
            🔍
          </p>
          <p className="font-bold">Nothing matches that.</p>
          <div>
            <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <motion.li
              key={p.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <Link
                to={`/problem/${p.slug}`}
                className="block h-full rounded-2xl focus-visible:outline-accent"
              >
                <Card className="h-full space-y-3 transition hover:-translate-y-0.5 hover:border-accent/60">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl">{p.title}</h2>
                    {isSolved(p.slug) && <Badge tint="ok">✓ Solved</Badge>}
                  </div>
                  <p className="text-sm text-muted">{p.flavor}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tint={TINT[p.difficulty]}>{p.difficulty}</Badge>
                    <Badge tint="accent">{p.xp} XP</Badge>
                    {p.tags.map((t) => (
                      <Badge key={t}>{humanizeTag(t)}</Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
