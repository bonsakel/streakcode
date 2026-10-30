import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getProblemMeta } from '@/features/problems';
import { ProblemLoader } from '@/features/problems/ui/ProblemLoader';

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

export default function ProblemPage() {
  const { slug = '' } = useParams();
  if (!getProblemMeta(slug)) return <NotFound slug={slug} />;
  return <ProblemLoader key={slug} slug={slug} />;
}
