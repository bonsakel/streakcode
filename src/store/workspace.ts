import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/features/judge/types';

interface WorkspaceState {
  /** Last language the user picked; new problems open in it. */
  language: Language;
  /** Editor width as a percentage of the problem page's split layout. */
  splitPct: number;
  drafts: Record<string, string>;
  setLanguage: (language: Language) => void;
  setSplitPct: (pct: number) => void;
  setDraft: (slug: string, language: Language, code: string) => void;
  clearDraft: (slug: string, language: Language) => void;
}

export const MIN_SPLIT = 25;
export const MAX_SPLIT = 75;

export const draftKey = (slug: string, language: Language) => `${slug}:${language}`;

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      language: 'javascript',
      splitPct: 42,
      drafts: {},
      setLanguage: (language) => set({ language }),
      setSplitPct: (pct) => set({ splitPct: Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, pct)) }),
      setDraft: (slug, language, code) =>
        set((s) => ({ drafts: { ...s.drafts, [draftKey(slug, language)]: code } })),
      clearDraft: (slug, language) =>
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[draftKey(slug, language)];
          return { drafts };
        }),
    }),
    { name: 'skill-issue:workspace', version: 1 },
  ),
);
