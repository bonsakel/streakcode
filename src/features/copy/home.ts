export const HOME_COPY = {
  tryTitle: 'Try it right now',
  tryBody:
    'No sign-up, no install. This is the real judge running on your device. The example is ready to run, or make it your own.',
  dailyTitle: "Today's daily challenge",
  ctaTitle: 'Ready when you are.',
  ctaBody: 'The first problem is free. So is the second. So is everything else.',
} as const;

export const ABOUT_COPY = {
  intro:
    'Streakcode is a friendly place to practice coding: solve bite-sized challenges, get instant feedback, and build a streak at your own pace. It is free, open source, and does not ask you to make an account.',
  how: [
    'Choose a challenge and write your answer in the editor. JavaScript, TypeScript, and Python are supported.',
    'Press Run to check the examples, or Submit to check every test and earn progress.',
    'Your code runs on your own device. It is not sent to an account or uploaded to a server.',
    'Each run has a time limit. If code gets stuck, Streakcode stops it so the rest of the page still works.',
    'Earn points, keep a daily streak, collect achievements, and take on the Boss Fight when you feel ready.',
  ],
  stored: [
    'Your saved answers for each challenge.',
    'Your solved challenges, points, streak, and achievements.',
    'Your display name and appearance settings.',
    'Your Boss Fight progress.',
  ],
  credits: [
    'The mascot, logo, sounds, and illustrations were made for this project.',
    'The code editor is Monaco (MIT License).',
    'Python runs with Pyodide (MPL 2.0).',
    'The fonts are Bricolage Grotesque and JetBrains Mono (SIL Open Font License).',
    'Celebration effects use canvas-confetti (ISC License).',
  ],
} as const;
