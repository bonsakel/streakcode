import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row">
        <p>
          Made with questionable sleep habits. No logins, no tracking, no cookies. Your code never
          leaves your device.
        </p>
        <div className="flex gap-4 font-semibold">
          <Link to="/about" className="hover:text-ink">
            About &amp; privacy
          </Link>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
