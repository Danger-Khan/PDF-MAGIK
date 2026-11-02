export function getExpiryNoticeText(hours: number): string {
  return `Informational only, not enforced by this PDF reader: treat this document as expired ${hours} hour${hours === 1 ? '' : 's'} after you first open it.`;
}

export async function stampExpiryNotice(
  sourceBytes: Uint8Array,
  hours: number,
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.load(sourceBytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const message = getExpiryNoticeText(hours);
  const maxFontSize = 7;
  const minFontSize = 4;

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const availableWidth = Math.max(width - 8, 1);
    let fontSize = maxFontSize;
    while (
      fontSize > minFontSize &&
      font.widthOfTextAtSize(message, fontSize) > availableWidth
    ) {
      fontSize -= 0.5;
    }

    const bandHeight = fontSize + 8;
    const textWidth = font.widthOfTextAtSize(message, fontSize);

    page.drawRectangle({
      x: 0,
      y: height - bandHeight,
      width,
      height: bandHeight,
      color: rgb(1, 0.92, 0.35),
      opacity: 0.9,
    });
    page.drawText(message, {
      x: Math.max(4, (width - textWidth) / 2),
      y: height - bandHeight + 4,
      size: fontSize,
      font,
      color: rgb(0.25, 0.18, 0),
    });
  }

  return pdf.save({ rewrite: true, useObjectStreams: true });
}
