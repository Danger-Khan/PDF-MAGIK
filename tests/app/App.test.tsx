// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { App } from '../../src/app/App';
import { ThemeProvider } from '../../src/app/ThemeProvider';

class TestResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  observe(_target: Element): void {}

  unobserve(_target: Element): void {}

  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:pdf-preview'),
    revokeObjectURL: vi.fn(),
  });
  window.localStorage.clear();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe('App', () => {
  it('renders the PDF protection workspace', () => {
    renderApp();

    expect(screen.getByRole('region', { name: 'Protect a PDF' })).toBeTruthy();
    expect(screen.getByText('No PDF selected yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Protect & download' })).toBeTruthy();
    expect(screen.getByText('Select a PDF to preview its pages here.')).toBeTruthy();
    expect(screen.queryByRole('slider', { name: /Reminder after/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Compress PDF' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('provides persistent, accessible theme and wallpaper alternatives', async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderApp();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Color theme' }), 'dark');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Background wallpaper' }),
      'mountain-snow',
    );

    expect(container.querySelector('.theme-root')?.getAttribute('data-theme')).toBe('dark');
    expect(container.querySelector('.theme-root')?.getAttribute('data-wallpaper')).toBe(
      'mountain-snow',
    );
    expect(window.localStorage.getItem('pdf-magik-theme')).toBe('dark');
    expect(window.localStorage.getItem('pdf-magik-wallpaper')).toBe('mountain-snow');
    expect(screen.queryByText('Adjust wallpaper')).toBeNull();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Color theme' }), 'light');
    expect(container.querySelector('.theme-root')?.getAttribute('data-theme')).toBe('light');
    unmount();

    renderApp();
    expect(screen.getByRole('combobox', { name: 'Color theme' })).toHaveProperty(
      'value',
      'light',
    );
    expect(screen.getByRole('combobox', { name: 'Background wallpaper' })).toHaveProperty(
      'value',
      'mountain-snow',
    );
  });

  it('only shows the hours slider when its reminder checkbox is enabled', async () => {
    const user = userEvent.setup();
    renderApp();

    const lifetimeSection = screen.getByRole('region', { name: 'Set a PDF lifetime reminder' });
    await user.click(
      within(lifetimeSection).getByRole('checkbox', {
        name: 'Set an informational PDF lifetime reminder',
      }),
    );

    const slider = within(lifetimeSection).getByRole('slider', {
      name: 'Reminder after 24 hours',
    });
    expect(slider).toHaveProperty('value', '24');
    fireEvent.change(slider, { target: { value: '48' } });
    expect(
      within(lifetimeSection).getByRole('slider', { name: 'Reminder after 48 hours' }),
    ).toHaveProperty('value', '48');

    await user.click(
      within(lifetimeSection).getByRole('checkbox', {
        name: 'Set an informational PDF lifetime reminder',
      }),
    );
    expect(within(lifetimeSection).queryByRole('slider')).toBeNull();
  });

  it('downloads a protected PDF and shows the selected lifetime reminder', async () => {
    const user = userEvent.setup();
    renderApp();

    const source = await PDFDocument.create();
    source.addPage([240, 320]);
    const pdf = new File([toArrayBuffer(await source.save())], 'sample.pdf', {
      type: 'application/pdf',
    });

    await user.upload(screen.getByLabelText('Choose a PDF file'), pdf);
    await screen.findByText('sample.pdf');

    await user.type(screen.getByLabelText('Password'), 'Strong password 2026!');
    await user.type(screen.getByLabelText('Confirm password'), 'Strong password 2026!');
    await user.click(
      screen.getByRole('checkbox', { name: 'Set an informational PDF lifetime reminder' }),
    );
    fireEvent.change(screen.getByRole('slider', { name: 'Reminder after 24 hours' }), {
      target: { value: '48' },
    });

    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:protected-pdf'),
      revokeObjectURL,
    });
    await user.click(screen.getByRole('button', { name: 'Protect & download' }));

    expect(await screen.findByText(/Informational reminder:/)).toBeTruthy();
    expect(screen.getAllByText('sample-protected.pdf').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Password')).toHaveProperty('value', '');
    await vi.waitFor(() => expect(revokeObjectURL).toHaveBeenCalled());
  });

  it('previews a selected PDF and enables local PDF tools', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    const source = await PDFDocument.create();
    source.addPage([240, 320]);
    const pdf = new File([toArrayBuffer(await source.save())], 'preview.pdf', {
      type: 'application/pdf',
    });
    await user.upload(screen.getByLabelText('Choose a PDF file'), pdf);

    const preview = await screen.findByTitle('PDF preview');
    expect(preview.getAttribute('src')).toBe('blob:pdf-preview');
    expect(screen.getByRole('button', { name: 'Compress PDF' })).toHaveProperty(
      'disabled',
      false,
    );
    expect(
      screen.getByRole('button', { name: 'Add background to PDF' }),
    ).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Merge PDFs' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(container.querySelector('.theme-root')?.getAttribute('data-wallpaper')).toBe(
      'map-farmland',
    );
    expect(
      screen.getByRole('combobox', { name: 'Background wallpaper' }).children.length,
    ).toBe(8);
  });

  it('runs compression, background, and merge actions from the PDF tools panel', async () => {
    const user = userEvent.setup();
    renderApp();

    const document = await PDFDocument.create();
    document.addPage([240, 320]).drawText('Original page');
    const pdf = new File([toArrayBuffer(await document.save())], 'source.pdf', {
      type: 'application/pdf',
    });
    await user.upload(screen.getByLabelText('Choose a PDF file'), pdf);

    const backgroundBytes = new Uint8Array(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=',
        'base64',
      ),
    );
    const background = new File([toArrayBuffer(backgroundBytes)], 'background.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText('Choose background image'), background);
    await user.click(screen.getByRole('button', { name: 'Add background to PDF' }));
    expect(
      await screen.findByText('PDF with the selected image on every page downloaded.'),
    ).toBeTruthy();

    const extraDocument = await PDFDocument.create();
    extraDocument.addPage([240, 320]).drawText('Additional page');
    const extraPdf = new File(
      [toArrayBuffer(await extraDocument.save())],
      'extra.pdf',
      { type: 'application/pdf' },
    );
    await user.upload(screen.getByLabelText('Choose additional PDFs to merge'), extraPdf);
    await user.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    expect(await screen.findByText('2 PDFs merged and downloaded.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Compress PDF' }));
    expect(await screen.findByText(/copy downloaded/)).toBeTruthy();
  });

  it('shows validation when protection is submitted without a PDF or passwords', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Protect & download' }));

    expect(await screen.findByText('Choose one PDF before protecting it.')).toBeTruthy();
    expect(screen.getByText('Use at least 8 characters and avoid a spaces-only password.')).toBeTruthy();
    expect(screen.getByText('Re-enter your opening password to confirm it.')).toBeTruthy();
  });

  it('accepts a PDF and clears the selected file and passwords for a new session', async () => {
    const user = userEvent.setup();
    renderApp();

    const pdf = new File(['%PDF-1.7\n'], 'sample.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('Choose a PDF file'), pdf);

    expect(await screen.findByText('sample.pdf')).toBeTruthy();
    expect(screen.getByText('sample-protected.pdf')).toBeTruthy();

    await user.type(screen.getByLabelText('Password'), 'Strong password 2026!');
    await user.type(screen.getByLabelText('Confirm password'), 'Strong password 2026!');
    await user.click(screen.getByRole('button', { name: 'Clear this session' }));

    expect(screen.getByText('No PDF selected yet')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toHaveProperty('value', '');
    expect(screen.getByLabelText('Confirm password')).toHaveProperty('value', '');
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
