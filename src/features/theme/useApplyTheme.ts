import { useEffect } from 'react';
import { useSettings } from '@/store/settings';

export function useApplyTheme() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}
