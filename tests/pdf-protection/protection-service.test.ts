import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { protectPdf } from '../../src/features/pdf-protection/protection-service';

describe('protectPdf', () => {
  it('creates an AES-256 encrypted copy that opens with the supplied password', async () => {
    const source = await PDFDocument.create();
    source.addPage([240, 320]);
    const sourceBytes = await source.save();
    const originalBytes = sourceBytes.slice();
    const protectedBytes = await protectPdf(sourceBytes, 'Strong password 2026!');
    const encryptedPdfText = new TextDecoder('latin1').decode(protectedBytes);

    expect(encryptedPdfText).toContain('/AESV3');
    expect(encryptedPdfText).toContain('/R 6');
    expect(encryptedPdfText).toContain('/Length 256');
    expect(sourceBytes).toEqual(originalBytes);
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow();
    await expect(
      PDFDocument.load(protectedBytes, { password: 'incorrect password' }),
    ).rejects.toThrow();

    const reopened = await PDFDocument.load(protectedBytes, {
      password: 'Strong password 2026!',
    });
    expect(reopened.getPageCount()).toBe(1);
  });
});
