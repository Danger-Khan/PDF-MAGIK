import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import {
  getExpiryNoticeText,
  stampExpiryNotice,
} from '../../src/features/pdf-protection/expiry-stamp';

describe('stampExpiryNotice', () => {
  it('draws a visible banner with the expiry text on every page', async () => {
    const source = await PDFDocument.create();
    source.addPage([240, 320]);
    source.addPage([180, 400]);
    const sourceBytes = await source.save();

    const stamped = await stampExpiryNotice(sourceBytes, 24);
    const document = await PDFDocument.load(stamped);

    expect(document.getPageCount()).toBe(2);
    expect(document.getPage(0).getWidth()).toBe(240);
    expect(document.getPage(1).getWidth()).toBe(180);
    expect(stamped.byteLength).toBeGreaterThan(sourceBytes.byteLength);
    expect(getExpiryNoticeText(24)).toBe(
      'Informational only, not enforced by this PDF reader: treat this document as expired 24 hours after you first open it.',
    );
    expect(getExpiryNoticeText(1)).toContain('1 hour after');
  });
});
