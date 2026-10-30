import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-xl text-center">
      <div aria-hidden="true" className="mb-3 text-5xl">
        🍳
      </div>
      <h1 className="mb-2 text-3xl">{title}</h1>
      <p className="mb-6 text-muted">{blurb}</p>
      <Link to="/">
        <Button variant="secondary">Back home</Button>
      </Link>
    </Card>
  );
}
