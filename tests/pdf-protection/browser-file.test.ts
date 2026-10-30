import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  getProtectedFilename,
  MAX_PDF_SIZE_BYTES,
  validatePdfFile,
  type BrowserFile,
} from '../../src/features/pdf-protection/browser-file';

function makeBrowserFile(name: string, contents: string): BrowserFile {
  const bytes = new TextEncoder().encode(contents);
  return {
    name,
    size: bytes.byteLength,
    slice: (start, end) =>
      new Blob([bytes.slice(start, end).buffer as ArrayBuffer]),
    arrayBuffer: async () => bytes.slice().buffer as ArrayBuffer,
  };
}

describe('browser file helpers', () => {
  it('requires a PDF extension and a PDF header', async () => {
    expect(await validatePdfFile(makeBrowserFile('notes.txt', '%PDF-1.7'))).toContain(
      '.pdf extension',
    );
    expect(await validatePdfFile(makeBrowserFile('notes.pdf', 'not a pdf'))).toContain(
      'does not appear to be a PDF',
    );
    expect(await validatePdfFile(makeBrowserFile('notes.pdf', '%PDF-1.7\n'))).toBeNull();
  });

  it('rejects empty PDFs and files above the browser processing limit', async () => {
    expect(await validatePdfFile(makeBrowserFile('empty.pdf', ''))).toContain(
      'file is empty',
    );

    const oversizedFile = {
      ...makeBrowserFile('large.pdf', '%PDF-1.7'),
      size: MAX_PDF_SIZE_BYTES + 1,
    };
    expect(await validatePdfFile(oversizedFile)).toContain('100 MB limit');
  });

  it('names a protected copy without changing the source name', () => {
    expect(getProtectedFilename('Quarterly-Report-2026.pdf')).toBe(
      'Quarterly-Report-2026-protected.pdf',
    );
    expect(getProtectedFilename('document')).toBe('document-protected.pdf');
  });

  it('formats file sizes for the selected-file summary', () => {
    expect(formatFileSize(0)).toBe('1 KB');
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2.4 MB');
  });
});
