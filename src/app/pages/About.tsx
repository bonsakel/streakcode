import { Card } from '@/components/Card';

export default function About() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-4xl">About Skill Issue</h1>
      <Card>
        <h2 className="mb-2 text-xl">Privacy</h2>
        <p className="text-muted">
          No accounts, no tracking, no cookies, no third-party scripts. Your code and progress stay
          on your device, in your browser&apos;s local storage.
        </p>
      </Card>
    </div>
  );
}
