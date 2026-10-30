import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { BossHud } from '@/features/boss/BossHud';
import { BOSS_DURATION_MS, BOSS_WIN_XP, formatClock, type BossRun } from '@/features/boss/engine';
import { BOSS_NAME, pickTaunt, type TauntKey } from '@/features/boss/taunts';
import { useNow } from '@/features/boss/useNow';
import { celebrate } from '@/features/effects/confetti';
import { playSound } from '@/features/effects/sound';
import type { VerdictKind } from '@/features/judge/types';
import { Mascot } from '@/features/mascot/Mascot';
import { ProblemLoader } from '@/features/problems/ui/ProblemLoader';
import { useBoss } from '@/store/boss';
import { useSettings } from '@/store/settings';

function Intro() {
  const { wins, losses, bestMs, start } = useBoss();
  const tone = useSettings((s) => s.tone);
  return (
    <Card className="mx-auto max-w-2xl space-y-5 text-center">
      <Mascot mood="thinking" className="mx-auto h-24 w-24" />
      <div className="space-y-2">
        <h1 className="text-4xl">Boss Fight</h1>
        <p className="text-lg font-semibold">{BOSS_NAME} blocks the way.</p>
        <p className="text-muted">
          Clear 3 escalating problems (easy, medium, hard) in {formatClock(BOSS_DURATION_MS)}. Each
          Accepted submission takes a chunk off the boss. Win for +{BOSS_WIN_XP} XP.
        </p>
      </div>
      <p className="text-sm italic text-muted">“{pickTaunt(tone, 'start', () => 0)}”</p>
      <Button size="lg" onClick={() => start()}>
        Fight the boss
      </Button>
      <p className="font-mono text-sm text-muted">
        {wins}W · {losses}L{bestMs !== null && ` · best ${formatClock(bestMs)}`}
      </p>
    </Card>
  );
}

function Ended({ run }: { run: BossRun }) {
  const { start, dismiss } = useBoss();
  const won = run.outcome === 'won';
  const took = (run.finishedAt ?? run.endsAt) - run.startedAt;
  const [taunt] = useState(() => pickTaunt(useSettings.getState().tone, won ? 'win' : 'lose'));
  return (
    <Card className="mx-auto max-w-2xl space-y-4 text-center">
      <Mascot mood={won ? 'celebrating' : 'sleepy'} className="mx-auto h-24 w-24" />
      <h1 className="text-4xl">{won ? 'Boss defeated!' : "Time's up"}</h1>
      <p className="text-muted">
        {won
          ? `Cleared in ${formatClock(took)}. +${BOSS_WIN_XP} XP.`
          : `${run.cleared.length}/${run.slugs.length} stages cleared.`}
      </p>
      <p className="text-sm italic">“{taunt}”</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => start()}>Rematch</Button>
        <Button variant="secondary" onClick={dismiss}>
          Back to the lobby
        </Button>
        <Link to="/profile">
          <Button variant="ghost">See profile</Button>
        </Link>
      </div>
    </Card>
  );
}

function Fight({ run }: { run: BossRun }) {
  const settle = useBoss((s) => s.settle);
  const clear = useBoss((s) => s.clear);
  const now = useNow(run.outcome === null);
  const [taunt, setTaunt] = useState(() => pickTaunt(useSettings.getState().tone, 'start'));
  const lastTaunt = useRef(taunt);
  const stage = run.slugs.find((s) => !run.cleared.includes(s));

  // Expire the run as soon as a tick (or a reload) finds the clock at zero.
  useEffect(() => {
    if (run.outcome === null && now >= run.endsAt) settle(now);
  }, [run, now, settle]);

  const say = (key: TauntKey) => {
    const next = pickTaunt(useSettings.getState().tone, key, Math.random, lastTaunt.current);
    lastTaunt.current = next;
    setTaunt(next);
  };

  const onSubmitted = (slug: string, verdict: VerdictKind) => {
    if (verdict !== 'accepted') {
      say('fail');
      return;
    }
    if (!clear(slug)) return;
    if (useBoss.getState().run?.outcome === 'won') {
      playSound('levelup');
      void celebrate();
    } else {
      say('hit');
    }
  };

  return (
    <div className="space-y-4">
      <BossHud run={run} now={now} taunt={run.outcome ? null : taunt} />
      {run.outcome ? (
        <Ended run={run} />
      ) : (
        stage && <ProblemLoader key={stage} slug={stage} onSubmitted={onSubmitted} />
      )}
    </div>
  );
}

export default function Boss() {
  const run = useBoss((s) => s.run);
  return run ? <Fight run={run} /> : <Intro />;
}
