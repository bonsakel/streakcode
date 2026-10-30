import type { VerdictKind } from '@/features/judge/types';
import type { Tone } from '@/store/settings';

/**
 * Verdict messages per tone. Add lines freely: the app picks one at random.
 * Rules: roast the code, never the person. `Professional` is plain and emoji-free.
 * Placeholders: {passed} {total} {handle}.
 */
export type MessageKey = VerdictKind | 'empty_function' | 'tle_streak' | 'first_solve';

export const MESSAGES: Record<Tone, Record<MessageKey, readonly string[]>> = {
  hype: {
    accepted: [
      'ACCEPTED. {handle}, that was clean. 🔥',
      'Every test passed. Main character behavior.',
      'Zero notes. Absolutely zero notes. ✨',
      '{passed}/{total} green. The algorithm bows to you.',
      'Big brain energy detected. Take the W. 🏆',
    ],
    wrong_answer: [
      'So close! {passed}/{total} passed. Your code has a plot hole.',
      'Plot twist: the answer was different. Check the failing test. 🔍',
      "Not yet, but you're warmer than you think. {passed}/{total} passed.",
      'Wrong answer, right attitude. Peek at the input that broke it.',
      'The tests have spoken, and they want a rewrite of one line.',
    ],
    time_limit_exceeded: [
      'Your code is still thinking... and thinking... and thinking. 😴',
      'Time limit exceeded. Is there a faster way to loop?',
      'It ran so long the test case aged out. Try a smarter approach.',
      'Slowpoke alert! Maybe a Map or a sort would speed things up.',
      'The clock won this round. Rematch?',
    ],
    runtime_error: [
      'Your code threw a tantrum. Read the error, it tells you where. 💥',
      'Runtime error. Something blew up mid-run, and it left a clue.',
      'Oops, it crashed. Great news: crashes point right at the bug.',
      'Exception thrown! Check what happens on the weird inputs.',
      'Boom. The error message is your best friend right now.',
    ],
    compile_error: [
      "Your code didn't even start. A missing bracket, perhaps? 🧩",
      'Syntax error. The computer needs it spelled out exactly.',
      "Couldn't compile that one. Check the line the error points to.",
      "It's giving 'unclosed parenthesis'. Quick fix, you've got this.",
      'Typo happens to everyone. Find it and run again.',
    ],
    empty_function: [
      'Bold strategy: submit nothing and hope. 🫡 Write a line first!',
      'That function is emptier than my fridge. Add some logic!',
      'The starter code is a great start. Now make it do something.',
    ],
    tle_streak: [
      'Five time-outs in a row. Are you okay? Stretch, water, then a fresh idea. 💧',
      'Five TLEs! Take a breather. A different approach beats a longer loop.',
    ],
    first_solve: [
      'First solve of this one! {handle} levels up. 🎉',
      'Locked in. The editorial is open to you now.',
    ],
  },
  roast: {
    accepted: [
      'Accepted. I looked for a flaw and came up empty. Annoying.',
      'Fine, it works. I was ready to be disappointed.',
      '{passed}/{total}. Okay, you can have this one.',
      'Passed everything. My roast material left unused.',
      'Correct. I assume that was luck, but a lucky streak counts.',
    ],
    wrong_answer: [
      '{passed}/{total}. Your code and the tests are not on speaking terms.',
      "Wrong answer. Bold of this code to assume it's correct.",
      'The logic took a wrong turn and refused to ask for directions.',
      'That output has main-character confidence and zero correctness. Check it.',
      'Interesting approach. Wrong, but interesting.',
    ],
    time_limit_exceeded: [
      'Time limit exceeded. A snail filed a complaint on your behalf. 🐌',
      'This code takes the scenic route. Every single time.',
      'The loop was never going to end, was it?',
      'Slow enough to watch the paint dry and then repaint.',
      "It's giving 'I'll optimize later'. Later is now.",
    ],
    runtime_error: [
      'Your code crashed harder than my last sleep schedule. 💥',
      'An exception, and not even a fancy one.',
      'It exploded. Spectacular. Read the error for the bug location.',
      'Crashes are just bugs announcing themselves loudly.',
      'The error message is begging you to read it.',
    ],
    compile_error: [
      "It doesn't compile. The parser is as confused as I am. 🤨",
      'Syntax error. The code is speaking a language that does not exist.',
      "Somewhere there's a bracket having a lonely time.",
      'The compiler read your code and sighed.',
      'A typo, probably. We have all been there. Fix it.',
    ],
    empty_function: [
      'An empty function. Minimalist art, but the judge wants logic. 🖼️',
      'You submitted the starter code. The starter code is not a solution.',
      'Zero lines of effort detected. One line is all it takes.',
    ],
    tle_streak: [
      'Five time-outs in a row. Are you okay? Water, stretch, new plan. 💧',
      'Five TLEs. The loop is not going to end by staring at it.',
    ],
    first_solve: [
      'First solve. Do not let it go to your head. Okay, a little. 🎉',
      'Solved. The editorial is yours, if you still need it.',
    ],
  },
  professional: {
    accepted: [
      'Accepted. All {total} tests passed.',
      'Accepted ({passed}/{total}).',
      'All test cases passed.',
    ],
    wrong_answer: [
      'Wrong Answer. {passed}/{total} tests passed.',
      'Output did not match the expected result on at least one test.',
      'Wrong Answer. Review the failing test below.',
    ],
    time_limit_exceeded: [
      'Time Limit Exceeded. Execution was stopped.',
      'Time Limit Exceeded. Consider a more efficient algorithm.',
      'The solution exceeded the time limit on a test.',
    ],
    runtime_error: [
      'Runtime Error. See the error message below.',
      'Your code raised an exception during execution.',
      'Runtime Error on at least one test.',
    ],
    compile_error: [
      'Compile Error. The code could not be parsed.',
      'Syntax error. See the message and line number below.',
      'The code failed to compile.',
    ],
    empty_function: [
      'The function body is empty. Implement the solution and run again.',
      'No implementation detected.',
    ],
    tle_streak: [
      'Five consecutive time limit errors. Consider a different approach.',
      'Repeated time limit errors. Review the algorithm complexity.',
    ],
    first_solve: ['Problem solved for the first time.', 'First accepted solution recorded.'],
  },
};

export interface MessageContext {
  passed: number;
  total: number;
  handle: string;
}

export function fillMessage(template: string, ctx: MessageContext): string {
  return template
    .replaceAll('{passed}', String(ctx.passed))
    .replaceAll('{total}', String(ctx.total))
    .replaceAll('{handle}', ctx.handle);
}

/** Pick a message for a tone. `avoid` is the previous one, so repeats are rare. */
export function pickMessage(
  tone: Tone,
  key: MessageKey,
  ctx: MessageContext,
  random: () => number = Math.random,
  avoid?: string,
): string {
  const pool = MESSAGES[tone][key];
  const filled = pool.map((t) => fillMessage(t, ctx));
  const fresh = filled.filter((m) => m !== avoid);
  const source = fresh.length > 0 ? fresh : filled;
  return source[Math.min(source.length - 1, Math.floor(random() * source.length))] ?? '';
}
