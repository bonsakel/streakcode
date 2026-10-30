export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Streakcode logo">
      <path d="M20 20l-4-8 9 4M44 20l4-8-9 4" fill="rgb(var(--c-pop))" />
      <path
        d="M12 40c0-12 8-22 20-22s20 10 20 22c0 5-5 7-20 7S12 45 12 40z"
        fill="rgb(var(--c-accent))"
      />
      <circle cx="24" cy="34" r="5" fill="#fff" />
      <circle cx="40" cy="34" r="5" fill="#fff" />
      <circle cx="25" cy="35" r="2.2" fill="#12121c" />
      <circle cx="41" cy="35" r="2.2" fill="#12121c" />
      <path
        d="M27 42q5 4 10 0"
        stroke="#12121c"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
