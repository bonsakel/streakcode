import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        accent: v('accent'),
        'accent-fg': v('accent-fg'),
        pop: v('pop'),
        ok: v('ok'),
        bad: v('bad'),
        warn: v('warn'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        pop: '0 4px 0 0 rgb(var(--c-accent) / 0.45)',
        glow: '0 0 40px -8px rgb(var(--c-accent) / 0.55)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: { float: 'float 4s ease-in-out infinite' },
    },
  },
  plugins: [],
} satisfies Config;
