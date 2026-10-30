import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { cn } from '@/components/cn';
import { NAV_LINKS } from './navLinks';
import { SettingsMenu } from './SettingsMenu';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-semibold transition',
    isActive ? 'bg-raised text-ink' : 'text-muted hover:bg-raised hover:text-ink',
  );

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <Link
          to="/"
          className="mr-2 flex items-center gap-2 rounded-lg"
          aria-label="Skill Issue home"
        >
          <Logo />
          <span className="font-display text-lg font-extrabold tracking-tight">
            Skill<span className="text-accent">Issue</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <SettingsMenu />
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-raised hover:text-ink md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden"
        >
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
