import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { HOME_COPY } from '@/features/copy/home';
import { DeferredHomeSections } from '@/features/home/DeferredHomeSections';

const FEATURES = [
  {
    emoji: '⚡',
    title: 'Zero setup',
    body: 'Open the link, write code, hit Run. No sign-up, no install, no email.',
  },
  {
    emoji: '🔒',
    title: 'Runs on your device',
    body: 'JavaScript, TypeScript and Python execute in your browser. Nothing is uploaded.',
  },
  {
    emoji: '🎮',
    title: 'Practice that feels like a game',
    body: 'XP, streaks, boss fights and achievements. Verdicts with personality.',
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-block rounded-full border border-line bg-raised px-3 py-1 text-sm font-semibold text-muted"
          >
            Free forever · No login · Runs in your browser
          </motion.p>
          <h1 className="text-5xl leading-[1.02] sm:text-7xl">
            Build your streak.
            <br />
            <span className="text-accent">One problem</span> at a time.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Streakcode makes it easy to build a coding habit. Solve bite-sized challenges in
            JavaScript, TypeScript, or Python, and get instant feedback. We roast the code, never
            you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/problems">
              <Button size="lg">Start cooking</Button>
            </Link>
            <a href="#try-it">
              <Button size="lg" variant="secondary">
                Try it now
              </Button>
            </a>
          </div>
        </div>
        <div className="grid place-items-center">
          <Logo className="h-56 w-56 animate-float drop-shadow-[0_0_40px_rgb(var(--c-accent)/0.5)]" />
        </div>
      </section>

      <section aria-labelledby="features" className="grid gap-4 md:grid-cols-3">
        <h2 id="features" className="sr-only">
          Features
        </h2>
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <div aria-hidden="true" className="mb-3 text-3xl">
              {f.emoji}
            </div>
            <h3 className="mb-1 text-xl">{f.title}</h3>
            <p className="text-muted">{f.body}</p>
          </Card>
        ))}
      </section>

      <DeferredHomeSections />

      <section className="rounded-2xl border border-line bg-raised px-6 py-10 text-center">
        <h2 className="text-3xl sm:text-4xl">{HOME_COPY.ctaTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{HOME_COPY.ctaBody}</p>
        <Link to="/problems" className="mt-6 inline-block">
          <Button size="lg">Start cooking</Button>
        </Link>
      </section>
    </div>
  );
}
