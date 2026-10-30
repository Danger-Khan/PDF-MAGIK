export interface BrowserFile {
  name: string;
  size: number;
  slice(start?: number, end?: number): Blob;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export const MAX_PDF_SIZE_BYTES = 100 * 1024 * 1024;

export async function validatePdfFile(file: BrowserFile): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Choose a file with a .pdf extension.';
  }

  if (file.size === 0) {
    return 'This file is empty. Choose a PDF with content.';
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return 'This file is larger than the 100 MB limit. Choose a smaller PDF to protect it in your browser.';
  }

  const header = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const headerText = new TextDecoder('latin1').decode(header);

  if (!headerText.includes('%PDF-')) {
    return 'This file does not appear to be a PDF. Choose a valid PDF document.';
  }

  return null;
}

export function getProtectedFilename(filename: string): string {
  const safeFilename = filename.replace(/[\\/]/g, '').trim() || 'document.pdf';
  const extensionIndex = safeFilename.toLowerCase().lastIndexOf('.pdf');
  const baseName =
    extensionIndex === safeFilename.length - 4
      ? safeFilename.slice(0, extensionIndex)
      : safeFilename;

  return `${baseName}-protected.pdf`;
}

export function getToolOutputFilename(filename: string, suffix: string): string {
  const safeFilename =
    filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'document.pdf';
  const extensionIndex = safeFilename.toLowerCase().lastIndexOf('.pdf');
  const baseName =
    extensionIndex === safeFilename.length - 4
      ? safeFilename.slice(0, extensionIndex)
      : safeFilename;

  return `${baseName}-${suffix}.pdf`;
}

export function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
