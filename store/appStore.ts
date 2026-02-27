import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'zh' | 'en';

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      language: 'zh',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-storage',
    }
  )
);

// Derived store for actual theme based on system preference
export const useActualTheme = () => {
  const { theme } = useAppStore();
  
  if (typeof window === 'undefined') return 'light';
  
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return theme;
};
