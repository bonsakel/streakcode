import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { ABOUT_COPY } from '@/features/copy/home';

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-4xl">About Streakcode</h1>
      <p className="text-lg text-muted">{ABOUT_COPY.intro}</p>

      <Card id="privacy" className="space-y-3">
        <h2 className="text-2xl">Privacy</h2>
        <p>
          <strong>No accounts, no tracking, no cookies, no third-party scripts.</strong> Your code
          never leaves your device, and there is no server to send it to.
        </p>
        <p className="text-muted">
          Some things are saved in your browser&apos;s local storage so the app remembers you:
        </p>
        <List items={ABOUT_COPY.stored} />
        <p className="text-muted">
          Clear your browser data and it is all gone. You can also export or import your progress
          from the{' '}
          <Link to="/profile" className="text-accent underline">
            profile page
          </Link>
          . The fonts, editor and Python runtime are served from this site, not a CDN.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-2xl">How the judge works</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          {ABOUT_COPY.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-2xl">Credits</h2>
        <List items={ABOUT_COPY.credits} />
      </Card>
    </div>
  );
}
