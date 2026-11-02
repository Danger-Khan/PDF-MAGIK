export const ENCRYPTION_ALGORITHM = 'AES-256' as const;

export async function protectPdf(
  sourceBytes: Uint8Array,
  openingPassword: string,
  expiryHours?: number | null,
): Promise<Uint8Array> {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure browser randomness is unavailable. Use a current browser over HTTPS.');
  }

  let workingBytes = sourceBytes;
  if (expiryHours) {
    const { stampExpiryNotice } = await import('./expiry-stamp');
    workingBytes = await stampExpiryNotice(sourceBytes, expiryHours);
  }

  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.load(workingBytes, { updateMetadata: false });
  pdf.encrypt({
    userPassword: openingPassword,
    ownerPassword: openingPassword,
    algorithm: ENCRYPTION_ALGORITHM,
  });

  return pdf.save({ rewrite: true });
}
