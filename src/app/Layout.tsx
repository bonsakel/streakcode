import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { ToastViewport } from '@/components/Toast';
import { toast } from '@/components/toastStore';
import { PaletteHost } from '@/features/palette/PaletteHost';
import { useApplyTheme } from '@/features/theme/useApplyTheme';
import { useKonami } from '@/features/theme/useKonami';
import { useSettings } from '@/store/settings';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

function PageFallback() {
  return (
    <div role="status" className="grid min-h-[40vh] place-items-center text-muted">
      <p className="animate-pulse font-display text-xl font-bold">Loading the good stuff...</p>
    </div>
  );
}

export function Layout() {
  useApplyTheme();
  const { pathname } = useLocation();
  const setTheme = useSettings((s) => s.setTheme);

  const unlockRetro = useCallback(() => {
    setTheme('retro');
    toast('Retro mode unlocked. Respect the classics. 🕹️', 'success');
  }, [setTheme]);
  useKonami(unlockRetro);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-accent px-4 py-2 font-bold text-accent-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ToastViewport />
      <PaletteHost />
    </div>
  );
}
