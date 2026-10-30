export const ENCRYPTION_ALGORITHM = 'AES-256' as const;

export async function protectPdf(
  sourceBytes: Uint8Array,
  openingPassword: string,
): Promise<Uint8Array> {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure browser randomness is unavailable. Use a current browser over HTTPS.');
  }

  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.load(sourceBytes, { updateMetadata: false });
  pdf.encrypt({
    userPassword: openingPassword,
    ownerPassword: openingPassword,
    algorithm: ENCRYPTION_ALGORITHM,
  });

  return pdf.save({ rewrite: true });
}
