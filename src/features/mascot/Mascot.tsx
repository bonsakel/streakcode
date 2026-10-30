import { motion, useReducedMotion } from 'framer-motion';

import type { Mood } from './mood';

const INK = '#12121c';

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'celebrating') {
    return (
      <g stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M19 36q5-7 10 0" />
        <path d="M35 36q5-7 10 0" />
      </g>
    );
  }
  if (mood === 'sleepy') {
    return (
      <g stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M19 36q5 4 10 0" />
        <path d="M35 36q5 4 10 0" />
      </g>
    );
  }
  const dy = mood === 'thinking' ? -2 : 0;
  const dx = mood === 'thinking' ? 2 : 0;
  return (
    <g>
      <circle cx="24" cy="35" r="5.5" fill="#fff" />
      <circle cx="40" cy="35" r="5.5" fill="#fff" />
      <circle cx={25 + dx} cy={36 + dy} r="2.4" fill={INK} />
      <circle cx={41 + dx} cy={36 + dy} r="2.4" fill={INK} />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const common = { stroke: INK, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const };
  if (mood === 'celebrating') {
    return (
      <path d="M26 43q6 8 12 0z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    );
  }
  if (mood === 'facepalm') return <path d="M27 47q5-4 10 0" {...common} />;
  if (mood === 'sleepy') return <ellipse cx="32" cy="46" rx="2.5" ry="3" fill={INK} />;
  if (mood === 'thinking') return <path d="M28 45h8" {...common} />;
  return <path d="M27 43q5 4 10 0" {...common} />;
}

const LABEL: Record<Mood, string> = {
  idle: 'Blobert the mascot, relaxed',
  thinking: 'Blobert the mascot, thinking',
  celebrating: 'Blobert the mascot, celebrating',
  facepalm: 'Blobert the mascot, facepalming',
  sleepy: 'Blobert the mascot, sleepy',
};

/** Blobert, the Streakcode mascot. Original SVG art; the body color follows the theme. */
export function Mascot({
  mood = 'idle',
  className = 'h-16 w-16',
}: {
  mood?: Mood;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const loop = reduce
    ? {}
    : mood === 'celebrating'
      ? { animate: { y: [0, -8, 0] }, transition: { repeat: Infinity, duration: 0.6 } }
      : mood === 'thinking'
        ? { animate: { rotate: [-3, 3, -3] }, transition: { repeat: Infinity, duration: 1.2 } }
        : mood === 'sleepy'
          ? { animate: { scale: [1, 1.04, 1] }, transition: { repeat: Infinity, duration: 3 } }
          : {};
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={LABEL[mood]}
      {...loop}
    >
      <path d="M20 20l-4-8 9 4M44 20l4-8-9 4" fill="rgb(var(--c-pop))" />
      <path
        d="M10 42c0-13 9-24 22-24s22 11 22 24c0 5-6 7-22 7S10 47 10 42z"
        fill="rgb(var(--c-accent))"
      />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {mood === 'facepalm' && (
        <path
          d="M44 28c6-2 10 4 8 10l-8 4z"
          fill="rgb(var(--c-accent))"
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {mood === 'sleepy' && (
        <text x="46" y="22" fontSize="10" fontWeight="700" fill="rgb(var(--c-muted))">
          z
        </text>
      )}
      {mood === 'thinking' && <circle cx="50" cy="20" r="3" fill="rgb(var(--c-muted))" />}
    </motion.svg>
  );
}
