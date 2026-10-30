import type { Tone } from '@/store/settings';

export const BOSS_NAME = 'Sir Spaghetti Code';

export type TauntKey = 'start' | 'hit' | 'fail' | 'win' | 'lose';

/** The boss is theatrical, never mean about the player. Professional tone stays plain. */
export const TAUNTS: Record<Tone, Record<TauntKey, readonly string[]>> = {
  hype: {
    start: [
      'You dare enter my 4,000-line function? Bold. Brave. Slightly unhinged.',
      'Three problems stand between you and glory. I have snacks. You have 30 minutes.',
      'Welcome, challenger. I was just refactoring everything into one file.',
    ],
    hit: [
      'Ow! Okay, that was clean. Rude, but clean.',
      'My health bar felt that. Do it again, I dare you.',
      'Impressive. I am now 33% less spaghetti.',
    ],
    fail: [
      'Not quite! The boss music gets louder.',
      'That one bounced off my armor of nested ternaries.',
      'Close, maybe? Read the error, then hit me again.',
    ],
    win: [
      'Defeated! My legacy code is now your legacy. Go touch grass, champion.',
      'You win! I will be in the corner, deleting my own comments.',
    ],
    lose: [
      'Time! I win this round. Rematch? I will not even change my moves.',
      'The clock got you, not me. Heal up and come back stronger.',
    ],
  },
  roast: {
    start: [
      'Ah, fresh meat. I mean, fresh code. Let us see what you have got.',
      'Three problems, 30 minutes. My function names are worse than your odds.',
      'Challenger approaches. Please do not summon me with a for loop inside a for loop.',
    ],
    hit: [
      'Fine. That worked. Do not let it go to your head.',
      'Ouch. I will pretend that was luck.',
      'You are slightly less hopeless than advertised.',
    ],
    fail: [
      'Bold of you to submit that.',
      'My tests are crying. Not from pain, from secondhand embarrassment.',
      'Wrong! Try reading the problem. It is right there.',
    ],
    win: [
      'You beat me. I am shocked, offended, and a little proud.',
      'Defeated. Tell the other bosses I tripped.',
    ],
    lose: [
      'Time is up. That timer had main-character energy. I say that lovingly.',
      'The clock wins. Run it back when your fingers recover.',
    ],
  },
  professional: {
    start: ['Boss fight started. Solve three problems of increasing difficulty in 30 minutes.'],
    hit: ['Stage cleared. Boss health reduced.'],
    fail: ['Submission did not pass. Review the failing case and try again.'],
    win: ['All stages cleared. Boss defeated.'],
    lose: ['Time expired before all stages were cleared.'],
  },
};

export function pickTaunt(
  tone: Tone,
  key: TauntKey,
  random: () => number = Math.random,
  avoid?: string,
): string {
  const pool = TAUNTS[tone][key];
  const options = pool.length > 1 ? pool.filter((l) => l !== avoid) : pool;
  return options[Math.floor(random() * options.length)]!;
}
