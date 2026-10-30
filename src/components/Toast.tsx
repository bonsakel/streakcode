import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useToasts, type ToastItem, type ToastKind } from './toastStore';
import { cn } from './cn';

const kindStyle: Record<ToastKind, string> = {
  info: 'border-accent/50',
  success: 'border-ok/60',
  error: 'border-bad/60',
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), 4000);
    return () => clearTimeout(t);
  }, [item.id, dismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        'pointer-events-auto rounded-xl border bg-raised px-4 py-3 text-sm shadow-glow',
        kindStyle[item.kind],
      )}
    >
      {item.message}
    </motion.li>
  );
}

export function ToastViewport() {
  const items = useToasts((s) => s.items);
  return (
    <ul
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2"
    >
      <AnimatePresence>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
