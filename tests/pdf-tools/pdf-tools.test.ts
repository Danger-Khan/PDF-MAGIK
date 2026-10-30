import { PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  addImageBackground,
  compressPdf,
  mergePdfs,
} from '../../src/features/pdf-tools/pdf-tools';
import { getToolOutputFilename } from '../../src/features/pdf-protection/browser-file';

async function createPdf(pageCount = 1): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    document.addPage([240 + index, 320]);
  }
  return document.save();
}

describe('PDF tools', () => {
  it('rewrites a valid PDF while preserving its pages', async () => {
    const output = await compressPdf(await createPdf(2));
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(2);
  });

  it('adds a full-page image behind every original page', async () => {
    const onePixelPng = new Uint8Array(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=',
        'base64',
      ),
    );
    const output = await addImageBackground(
      await createPdf(2),
      onePixelPng,
      'image/png',
    );
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(2);
    expect(document.getPage(0).getWidth()).toBe(240);
    expect(document.getPage(1).getWidth()).toBe(241);
  });

  it('merges valid PDFs in order and requires at least two files', async () => {
    const first = new File([toArrayBuffer(await createPdf())], 'first.pdf', {
      type: 'application/pdf',
    });
    const second = new File([toArrayBuffer(await createPdf(2))], 'second.pdf', {
      type: 'application/pdf',
    });
    const output = await mergePdfs([first, second]);
    const document = await PDFDocument.load(output);

    expect(document.getPageCount()).toBe(3);
    await expect(mergePdfs([first])).rejects.toThrow('Choose at least two PDFs');
  });

  it('builds safe output filenames', () => {
    expect(getToolOutputFilename('report.pdf', 'merged')).toBe('report-merged.pdf');
    expect(getToolOutputFilename('report', 'compressed')).toBe('report-compressed.pdf');
    expect(getToolOutputFilename('C:\\private\\report.pdf', 'background')).toBe(
      'Cprivatereport-background.pdf',
    );
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
