import { lazy, Suspense, useEffect } from 'react';
import { usePalette } from './paletteStore';

const CommandPalette = lazy(() =>
  import('./CommandPalette').then((module) => ({ default: module.CommandPalette })),
);

export function PaletteHost() {
  const open = usePalette((s) => s.open);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        usePalette.getState().toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return open ? (
    <Suspense fallback={null}>
      <CommandPalette />
    </Suspense>
  ) : null;
}
