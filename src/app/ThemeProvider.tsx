import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { darkTheme, lightTheme } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export const themeModes = ['system', 'light', 'dark'] as const;

export const wallpapers = {
  'map-farmland': 'Map farmland',
  'mountain-desert': 'Desert mountain',
  'mountain-green': 'Green mountain',
  'mountain-snow': 'Snowy mountain',
  'house-desert': 'Desert house',
  'village-desert': 'Desert village',
  'buildings-above-sky': 'Buildings above the sky',
  'japanese-gate-shadow': 'Japanese gate',
} as const;

export type Wallpaper = keyof typeof wallpapers;
export const wallpaperOptions = Object.keys(wallpapers) as Wallpaper[];

export function isThemeMode(value: string): value is ThemeMode {
  return themeModes.some((mode) => mode === value);
}

export function isWallpaper(value: string): value is Wallpaper {
  return wallpaperOptions.some((wallpaper) => wallpaper === value);
}

interface ThemePreferences {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  wallpaper: Wallpaper;
  setWallpaper: (wallpaper: Wallpaper) => void;
}

const ThemePreferencesContext = createContext<ThemePreferences | null>(null);

function storedValue<T extends string>(
  key: string,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const stored = window.localStorage.getItem(key);
  return allowedValues.find((value) => value === stored) ?? fallback;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    storedValue('pdf-magik-theme', themeModes, 'system'),
  );
  const [wallpaper, setWallpaper] = useState<Wallpaper>(() =>
    storedValue('pdf-magik-wallpaper', wallpaperOptions, 'map-farmland'),
  );
  const [systemIsDark, setSystemIsDark] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const resolvedTheme = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;
  const theme = useMemo(
    () => (resolvedTheme === 'dark' ? darkTheme : lightTheme),
    [resolvedTheme],
  );
  const preferences = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      wallpaper,
      setWallpaper,
    }),
    [themeMode, wallpaper],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('pdf-magik-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem('pdf-magik-wallpaper', wallpaper);
  }, [wallpaper]);

  return (
    <ThemePreferencesContext.Provider value={preferences}>
      <div
        className="theme-root"
        data-theme={resolvedTheme}
        data-wallpaper={wallpaper}
      >
        <FluentProvider className="fluent-theme" theme={theme}>
          {children}
        </FluentProvider>
      </div>
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences(): ThemePreferences {
  const preferences = useContext(ThemePreferencesContext);
  if (!preferences) {
    throw new Error('useThemePreferences must be used within ThemeProvider.');
  }
  return preferences;
}
