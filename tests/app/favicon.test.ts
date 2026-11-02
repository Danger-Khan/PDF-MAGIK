// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { applyWallpaperFavicon } from '../../src/app/favicon';

function addLink(id: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'icon';
  link.href = 'about:blank';
  document.head.append(link);
  return link;
}

describe('applyWallpaperFavicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    addLink('app-favicon-32');
    addLink('app-favicon-48');
    addLink('app-touch-icon');
  });

  it('points every favicon link at that wallpaper\'s personalized icon', () => {
    applyWallpaperFavicon('mountain-snow');
    const snowHrefs = [
      document.getElementById('app-favicon-32'),
      document.getElementById('app-favicon-48'),
      document.getElementById('app-touch-icon'),
    ].map((link) => (link as HTMLLinkElement).href);

    expect(snowHrefs.every((href) => href && href !== 'about:blank')).toBe(true);

    applyWallpaperFavicon('village-desert');
    const desertHrefs = [
      document.getElementById('app-favicon-32'),
      document.getElementById('app-favicon-48'),
      document.getElementById('app-touch-icon'),
    ].map((link) => (link as HTMLLinkElement).href);

    snowHrefs.forEach((href, index) => {
      expect(desertHrefs[index]).not.toBe(href);
    });
  });

  it('leaves existing links untouched for an unknown wallpaper', () => {
    // @ts-expect-error intentionally invalid wallpaper to exercise the guard clause
    applyWallpaperFavicon('not-a-real-wallpaper');
    expect((document.getElementById('app-favicon-32') as HTMLLinkElement).href).toBe(
      'about:blank',
    );
  });
});
