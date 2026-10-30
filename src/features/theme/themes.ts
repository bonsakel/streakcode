export const THEMES = [
  { id: 'midnight', label: 'Midnight', emoji: '🌙', swatch: ['#8b7cff', '#ff7ab6'] },
  { id: 'light', label: 'Daylight', emoji: '☀️', swatch: ['#5b43d6', '#ca1f78'] },
  { id: 'neon', label: 'Gamer Neon', emoji: '🕹️', swatch: ['#00f0ff', '#ff2ec4'] },
  { id: 'grass', label: 'Touch Grass', emoji: '🌱', swatch: ['#78dc78', '#ffc857'] },
  { id: 'sunset', label: 'Sunset Doomscroll', emoji: '🌇', swatch: ['#ff8a4c', '#ff5e96'] },
] as const;

export type SelectableThemeId = (typeof THEMES)[number]['id'];
export type ThemeId = SelectableThemeId | 'retro';

export const DEFAULT_THEME: ThemeId = 'midnight';

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'retro' || THEMES.some((t) => t.id === value);
}
