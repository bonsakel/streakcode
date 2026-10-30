import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateHandle } from '@/lib/handle';
import { DEFAULT_THEME, type ThemeId } from '@/features/theme/themes';

export type Tone = 'hype' | 'roast' | 'professional';

interface SettingsState {
  theme: ThemeId;
  tone: Tone;
  soundOn: boolean;
  handle: string;
  setTheme: (theme: ThemeId) => void;
  setTone: (tone: Tone) => void;
  toggleSound: () => void;
  rerollHandle: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      tone: 'hype',
      soundOn: false,
      handle: generateHandle(),
      setTheme: (theme) => set({ theme }),
      setTone: (tone) => set({ tone }),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      rerollHandle: () => set({ handle: generateHandle() }),
    }),
    { name: 'skill-issue:settings', version: 1 },
  ),
);

// zustand only writes on change; persist the generated handle right away so it is stable across reloads.
useSettings.setState({ handle: useSettings.getState().handle });
