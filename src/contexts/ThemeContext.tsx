import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** User's explicit preference (system | light | dark) */
  preference: ThemePreference;
  /** Resolved theme after applying system preference */
  effectiveTheme: EffectiveTheme;
  /** Update the theme preference */
  setPreference: (pref: ThemePreference) => void;
  /** Cycle to the next theme: system → light → dark → system */
  cycleTheme: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'theme-preference';
const THEME_CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(pref: ThemePreference): EffectiveTheme {
  return pref === 'system' ? getSystemTheme() : pref;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage may be unavailable (private browsing, storage full)
  }
  return 'system';
}

function writeStoredPreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // localStorage may be unavailable
  }
}

function applyThemeToDOM(theme: EffectiveTheme): void {
  const root = document.documentElement;

  // Add transition class briefly for smooth theme switch
  root.classList.add('theme-transitioning');
  root.setAttribute('data-theme', theme);

  // Remove transition class after animations complete
  requestAnimationFrame(() => {
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 350);
  });
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveTheme(readStoredPreference()));

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    writeStoredPreference(pref);
    const resolved = resolveTheme(pref);
    setEffectiveTheme(resolved);
    applyThemeToDOM(resolved);
  }, []);

  const cycleTheme = useCallback(() => {
    const currentIndex = THEME_CYCLE.indexOf(preference);
    const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    setPreference(next);
  }, [preference, setPreference]);

  // Apply theme on mount (in case inline script in <head> didn't run)
  useEffect(() => {
    applyThemeToDOM(effectiveTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved: EffectiveTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(resolved);
      applyThemeToDOM(resolved);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, effectiveTheme, setPreference, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components -- Hook must be co-located with its context provider
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
