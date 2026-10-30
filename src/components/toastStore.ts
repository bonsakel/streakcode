import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';
export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (message, kind = 'info') =>
    set((s) => ({ items: [...s.items.slice(-3), { id: nextId++, kind, message }] })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, kind?: ToastKind) =>
  useToasts.getState().push(message, kind);
