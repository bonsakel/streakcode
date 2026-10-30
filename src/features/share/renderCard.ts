import { CARD_HEIGHT, CARD_WIDTH, wrapText, type CardModel } from './cardModel';

const rgb = (name: string, fallback: string, alpha = 1) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return fallback;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
};

const DISPLAY = '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif';
const BODY = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

function drawBlob(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, c: Palette) {
  const k = size / 64;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = c.pop;
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(16, 12);
  ctx.lineTo(25, 16);
  ctx.moveTo(44, 20);
  ctx.lineTo(48, 12);
  ctx.lineTo(39, 16);
  ctx.fill();
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.moveTo(10, 42);
  ctx.bezierCurveTo(10, 29, 19, 18, 32, 18);
  ctx.bezierCurveTo(45, 18, 54, 29, 54, 42);
  ctx.bezierCurveTo(54, 47, 48, 49, 32, 49);
  ctx.bezierCurveTo(16, 49, 10, 47, 10, 42);
  ctx.fill();
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(19, 36);
  ctx.quadraticCurveTo(24, 29, 29, 36);
  ctx.moveTo(35, 36);
  ctx.quadraticCurveTo(40, 29, 45, 36);
  ctx.stroke();
  ctx.fillStyle = '#12121c';
  ctx.beginPath();
  ctx.moveTo(26, 43);
  ctx.quadraticCurveTo(32, 51, 38, 43);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface Palette {
  bg: string;
  surface: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  pop: string;
  ok: string;
}

const DIFFICULTY_COLOR = { easy: 'ok', medium: 'pop', hard: 'pop' } as const;

/** Draws the share card with the user's current theme colors. Pure canvas: no network, no assets. */
export function renderCard(canvas: HTMLCanvasElement, model: CardModel): void {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const c: Palette = {
    bg: rgb('--c-bg', '#0c0d16'),
    surface: rgb('--c-surface', '#141624'),
    line: rgb('--c-line', '#343854'),
    ink: rgb('--c-ink', '#eef0fc'),
    muted: rgb('--c-muted', '#a0a6c4'),
    accent: rgb('--c-accent', '#8b7cff'),
    pop: rgb('--c-pop', '#ff7ab6'),
    ok: rgb('--c-ok', '#4ade80'),
  };

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const glow = ctx.createRadialGradient(1050, 80, 20, 1050, 80, 520);
  glow.addColorStop(0, rgb('--c-accent', '#8b7cff', 0.35));
  glow.addColorStop(1, rgb('--c-accent', '#8b7cff', 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = c.surface;
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 40, CARD_WIDTH - 80, CARD_HEIGHT - 80, 36);
  ctx.fill();
  ctx.stroke();

  drawBlob(ctx, 90, 70, 96, c);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = c.ink;
  ctx.font = `800 40px ${DISPLAY}`;
  ctx.fillText('Streak', 200, 128);
  const streakWidth = ctx.measureText('Streak').width;
  ctx.fillStyle = c.accent;
  ctx.fillText('code', 200 + streakWidth, 128);

  const pill = model.headline;
  ctx.font = `800 30px ${DISPLAY}`;
  const pillW = ctx.measureText(pill).width + 48;
  ctx.fillStyle = rgb('--c-ok', '#4ade80', 0.16);
  ctx.strokeStyle = c.ok;
  ctx.beginPath();
  ctx.roundRect(CARD_WIDTH - 90 - pillW, 78, pillW, 56, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.ok;
  ctx.fillText(pill, CARD_WIDTH - 90 - pillW + 24, 117);

  ctx.fillStyle = c.ink;
  ctx.font = `800 64px ${DISPLAY}`;
  const titleLines = wrapText(model.title, CARD_WIDTH - 180, (s) => ctx.measureText(s).width, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, 90, 250 + i * 72));
  const afterTitle = 250 + (titleLines.length - 1) * 72;

  ctx.font = `700 24px ${BODY}`;
  ctx.fillStyle = c[DIFFICULTY_COLOR[model.difficulty]];
  ctx.fillText(model.difficulty.toUpperCase(), 90, afterTitle + 44);

  ctx.font = `italic 600 30px ${BODY}`;
  ctx.fillStyle = c.muted;
  const verdictLines = wrapText(
    `"${model.verdictLine}"`,
    CARD_WIDTH - 180,
    (s) => ctx.measureText(s).width,
    2,
  );
  verdictLines.forEach((line, i) => ctx.fillText(line, 90, afterTitle + 100 + i * 42));

  const statsY = CARD_HEIGHT - 210;
  model.stats.forEach((stat, i) => {
    const x = 90 + i * 330;
    ctx.fillStyle = c.muted;
    ctx.font = `600 22px ${BODY}`;
    ctx.fillText(stat.label.toUpperCase(), x, statsY);
    ctx.fillStyle = c.ink;
    ctx.font = `800 44px ${DISPLAY}`;
    ctx.fillText(stat.value, x, statsY + 52);
  });

  ctx.fillStyle = c.line;
  ctx.fillRect(90, CARD_HEIGHT - 120, CARD_WIDTH - 180, 2);
  ctx.fillStyle = c.ink;
  ctx.font = `700 28px ${BODY}`;
  ctx.fillText(model.footer, 90, CARD_HEIGHT - 76);
  ctx.fillStyle = c.muted;
  ctx.font = `600 22px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText('un-cook yourself, one problem at a time', CARD_WIDTH - 90, CARD_HEIGHT - 76);
  ctx.textAlign = 'left';
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))),
      'image/png',
    ),
  );
}
