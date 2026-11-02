import type { Wallpaper } from './ThemeProvider';

const iconModules = import.meta.glob<string>(
  '../assets/icon/wallpapers/*/icon-*.png',
  { eager: true, import: 'default', query: '?url' },
);

const iconsByWallpaper = new Map<string, Map<number, string>>();

for (const [path, url] of Object.entries(iconModules)) {
  const match = /wallpapers\/([^/]+)\/icon-(\d+)\.png$/.exec(path);
  if (!match) continue;
  const [, wallpaper, size] = match;
  const sizes = iconsByWallpaper.get(wallpaper) ?? new Map<number, string>();
  sizes.set(Number(size), url);
  iconsByWallpaper.set(wallpaper, sizes);
}

export function applyWallpaperFavicon(wallpaper: Wallpaper): void {
  const sizes = iconsByWallpaper.get(wallpaper);
  if (!sizes) return;

  setIconHref('app-favicon-32', sizes.get(32));
  setIconHref('app-favicon-48', sizes.get(48));
  setIconHref('app-touch-icon', sizes.get(180));
}

function setIconHref(id: string, href: string | undefined): void {
  if (!href || typeof document === 'undefined') return;
  const link = document.getElementById(id);
  if (link instanceof HTMLLinkElement) {
    link.href = href;
  }
}
