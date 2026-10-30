import { Badge } from '@/components/Badge';
import { LANGUAGE_LABEL, VERDICT_LABEL, VERDICT_TINT } from '@/features/judge/statusUi';
import type { Language } from '@/features/judge/types';
import { useProgress } from '@/store/progress';
import { Button } from '@/components/Button';
import { Markdown } from './Markdown';

export function EditorialPanel({ slug, editorial }: { slug: string; editorial: string }) {
  const solved = useProgress((s) => s.solved[slug]);
  if (!solved) {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          🔒
        </p>
        <p className="mt-2 font-bold">Editorial unlocks when you solve it</p>
        <p className="text-sm text-muted">No spoilers on the way in. Get an Accepted first.</p>
      </div>
    );
  }
  return <Markdown>{editorial}</Markdown>;
}

export function SubmissionsPanel({
  slug,
  onLoad,
}: {
  slug: string;
  onLoad: (language: Language, code: string) => void;
}) {
  const submissions = useProgress((s) => s.submissions[slug]) ?? [];
  if (submissions.length === 0) {
    return <p className="text-sm text-muted">No submissions yet. Hit Submit when you're ready.</p>;
  }
  return (
    <ul className="space-y-2">
      {submissions.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-raised/60 p-3 text-sm"
        >
          <Badge tint={VERDICT_TINT[s.verdict]}>{VERDICT_LABEL[s.verdict]}</Badge>
          <span className="font-mono text-muted">
            {s.passed}/{s.total}
          </span>
          <span className="text-muted">{LANGUAGE_LABEL[s.language]}</span>
          <time className="text-xs text-muted" dateTime={new Date(s.at).toISOString()}>
            {new Date(s.at).toLocaleString()}
          </time>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => onLoad(s.language, s.code)}
          >
            Load code
          </Button>
        </li>
      ))}
    </ul>
  );
}
