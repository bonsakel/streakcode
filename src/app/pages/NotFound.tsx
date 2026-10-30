import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function NotFound() {
  return (
    <Card className="mx-auto mt-10 max-w-xl text-center">
      <div aria-hidden="true" className="mb-3 text-5xl">
        🧭
      </div>
      <h1 className="mb-2 text-3xl">404: page not found</h1>
      <p className="mb-6 text-muted">This route doesn&apos;t exist. Honestly, same.</p>
      <Link to="/">
        <Button>Take me home</Button>
      </Link>
    </Card>
  );
}
