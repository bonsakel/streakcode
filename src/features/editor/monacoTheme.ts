export interface ThemeTokens {
  bg: string;
  surface: string;
  raised: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  pop: string;
  ok: string;
  bad: string;
  warn: string;
}

export interface MonacoThemeData {
  base: 'vs' | 'vs-dark';
  inherit: true;
  rules: { token: string; foreground: string; fontStyle?: string }[];
  colors: Record<string, string>;
}

/** "139 124 255" -> "8b7cff". Returns undefined for anything that is not an RGB triplet. */
export function tripletToHex(triplet: string): string | undefined {
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return undefined;
  }
  return parts.map((n) => n.toString(16).padStart(2, '0')).join('');
}

const luminance = (hex: string) => {
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** Turns the active CSS-variable theme into a Monaco theme so the editor always matches the app. */
export function buildMonacoTheme(tokens: ThemeTokens): MonacoThemeData {
  const hex = {} as ThemeTokens;
  for (const key of Object.keys(tokens) as (keyof ThemeTokens)[]) {
    hex[key] = tripletToHex(tokens[key]) ?? '808080';
  }
  const alpha = (color: string, a: string) => `#${color}${a}`;

  return {
    base: luminance(hex.bg) > 0.5 ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: hex.muted, fontStyle: 'italic' },
      { token: 'keyword', foreground: hex.accent },
      { token: 'string', foreground: hex.ok },
      { token: 'number', foreground: hex.warn },
      { token: 'type', foreground: hex.pop },
      { token: 'delimiter', foreground: hex.muted },
      { token: 'identifier', foreground: hex.ink },
    ],
    colors: {
      'editor.background': `#${hex.bg}`,
      'editor.foreground': `#${hex.ink}`,
      'editorLineNumber.foreground': `#${hex.muted}`,
      'editorLineNumber.activeForeground': `#${hex.ink}`,
      'editorCursor.foreground': `#${hex.accent}`,
      'editor.selectionBackground': alpha(hex.accent, '44'),
      'editor.inactiveSelectionBackground': alpha(hex.accent, '22'),
      'editor.lineHighlightBackground': alpha(hex.raised, '99'),
      'editorIndentGuide.background1': alpha(hex.line, '88'),
      'editorWidget.background': `#${hex.surface}`,
      'editorWidget.border': `#${hex.line}`,
      'editorSuggestWidget.background': `#${hex.surface}`,
      'editorSuggestWidget.selectedBackground': `#${hex.raised}`,
      'scrollbarSlider.background': alpha(hex.line, '99'),
      'scrollbarSlider.hoverBackground': alpha(hex.muted, '88'),
      'editorError.foreground': `#${hex.bad}`,
    },
  };
}

export const TOKEN_NAMES = [
  'bg',
  'surface',
  'raised',
  'line',
  'ink',
  'muted',
  'accent',
  'pop',
  'ok',
  'bad',
  'warn',
] as const satisfies readonly (keyof ThemeTokens)[];

export function readThemeTokens(element: Element = document.documentElement): ThemeTokens {
  const style = getComputedStyle(element);
  const out = {} as ThemeTokens;
  for (const name of TOKEN_NAMES) out[name] = style.getPropertyValue(`--c-${name}`);
  return out;
}
