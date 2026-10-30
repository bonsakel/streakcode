import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const TryItNow = lazy(() => import('./TryItNow').then((module) => ({ default: module.TryItNow })));
const DailyCard = lazy(() =>
  import('./DailyCard').then((module) => ({ default: module.DailyCard })),
);

export function DeferredHomeSections() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[820px] space-y-16 md:min-h-[700px]">
      {visible ? (
        <Suspense
          fallback={
            <p role="status" className="min-h-24 text-sm text-muted">
              Getting the daily challenge ready...
            </p>
          }
        >
          <TryItNow />
          <DailyCard />
        </Suspense>
      ) : (
        <div aria-hidden="true" />
      )}
    </div>
  );
}
