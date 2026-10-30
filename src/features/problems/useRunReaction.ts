import { useRef, useState } from 'react';
import { toast } from '@/components/toastStore';
import { isEmptyFunction, nextTleStreak, TLE_STREAK_LENGTH } from '@/features/copy/easterEggs';
import { pickMessage, type MessageKey } from '@/features/copy/verdicts';
import { celebrate } from '@/features/effects/confetti';
import { playSound, soundForVerdict } from '@/features/effects/sound';
import { ACHIEVEMENT_BY_ID } from '@/features/gamification/achievements';
import type { Finished } from '@/features/problems/useJudgeRun';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/** Everything that happens after a run: tone message, sound, confetti, scoring and rewards toasts. */
export function useRunReaction(slug: string) {
  const [message, setMessage] = useState<string | null>(null);
  const tleStreak = useRef(0);
  const lastMessage = useRef<string | undefined>(undefined);

  const onFinished = ({ mode, language, code, verdict }: Finished) => {
    tleStreak.current = nextTleStreak(tleStreak.current, verdict.kind);
    const wasSolved = useProgress.getState().solved[slug] !== undefined;
    const firstSolve = mode === 'submit' && verdict.kind === 'accepted' && !wasSolved;

    let key: MessageKey = verdict.kind;
    if (verdict.kind !== 'accepted' && isEmptyFunction(code, language)) key = 'empty_function';
    else if (tleStreak.current >= TLE_STREAK_LENGTH) key = 'tle_streak';
    else if (firstSolve) key = 'first_solve';
    if (key === 'tle_streak') tleStreak.current = 0;

    const { tone, handle } = useSettings.getState();
    const next = pickMessage(
      tone,
      key,
      { passed: verdict.passed, total: verdict.total, handle },
      Math.random,
      lastMessage.current,
    );
    lastMessage.current = next;
    setMessage(next);
    playSound(soundForVerdict(verdict.kind));
    if (verdict.kind === 'accepted') void celebrate();

    if (mode !== 'submit') return;
    const outcome = useProgress.getState().recordSubmission(slug, {
      language,
      verdict: verdict.kind,
      passed: verdict.passed,
      total: verdict.total,
      maxTimeMs: verdict.maxTimeMs,
      code,
    });

    if (outcome.xp) {
      const { hintPenalty, firstTry, speed } = outcome.xp;
      const extras = [
        firstTry && `first try +${firstTry}`,
        speed && `speed +${speed}`,
        hintPenalty && `hints -${hintPenalty}`,
      ].filter(Boolean);
      toast(
        `+${outcome.xp.total} XP${extras.length ? ` (${extras.join(', ')})` : ''}. Editorial unlocked. 🎉`,
        'success',
      );
    }
    if (outcome.dailyBonus)
      toast(`Daily challenge done! +${outcome.dailyBonus} bonus XP 📅`, 'success');
    if (outcome.levelUp) {
      playSound('levelup');
      toast(`Level up! You are now ${outcome.levelUp.title}. ⬆️`, 'success');
    }
    for (const id of outcome.newAchievements) {
      const a = ACHIEVEMENT_BY_ID.get(id);
      if (a) toast(`Achievement unlocked: ${a.icon} ${a.title}`, 'success');
    }
  };

  return { message, onFinished };
}
