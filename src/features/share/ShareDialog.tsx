import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/toastStore';
import { levelFor } from '@/features/gamification/levels';
import { totalXp, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { buildCardModel, cardFilename, shareUrl, type CardInput } from './cardModel';
import { canvasToBlob, renderCard } from './renderCard';

export type ShareDetails = Omit<CardInput, 'handle' | 'levelTitle' | 'levelNumber'>;

export function ShareDialog({
  details,
  onClose,
}: {
  details: ShareDetails | null;
  onClose: () => void;
}) {
  return (
    <Modal open={details !== null} onClose={onClose} title="Share your win" wide>
      {details && <ShareBody details={details} onClose={onClose} />}
    </Modal>
  );
}

function ShareBody({ details, onClose }: { details: ShareDetails; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const handle = useSettings((s) => s.handle);
  const xp = useProgress(totalXp);
  const level = levelFor(xp);
  const model = useMemo(
    () =>
      buildCardModel({
        ...details,
        handle,
        levelTitle: level.title,
        levelNumber: level.index + 1,
      }),
    [details, handle, level.title, level.index],
  );

  useEffect(() => {
    let live = true;
    const draw = () => {
      if (live && canvas.current) {
        renderCard(canvas.current, model);
        setReady(true);
      }
    };
    // Wait for the web fonts so the card does not render in a fallback face.
    void (document.fonts?.ready ?? Promise.resolve()).then(draw, draw);
    return () => {
      live = false;
    };
  }, [model]);

  const download = async () => {
    if (!canvas.current) return;
    try {
      const url = URL.createObjectURL(await canvasToBlob(canvas.current));
      const a = document.createElement('a');
      a.href = url;
      a.download = cardFilename(details.slug);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Couldn't make the image. Try a screenshot instead!", 'error');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(window.location.origin, details.slug));
      toast('Link copied. Go flex responsibly. 🔗', 'success');
    } catch {
      toast('Copy blocked by the browser. Copy the address bar instead.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvas}
        role="img"
        aria-label={`Result card: ${model.title}, accepted, ${model.stats[0]?.value}`}
        className="aspect-[1200/630] w-full rounded-xl border border-line bg-bg"
      />
      <p className="text-xs text-muted">
        Made on your device. The link just opens this problem; it carries none of your data.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="secondary" onClick={() => void copyLink()}>
          Copy link
        </Button>
        <Button onClick={() => void download()} disabled={!ready}>
          Download PNG
        </Button>
      </div>
    </div>
  );
}
