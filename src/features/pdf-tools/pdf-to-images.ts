export type PdfImageFormat = 'image/png' | 'image/jpeg';

export interface PdfPageImage {
  pageNumber: number;
  bytes: Uint8Array;
}

export async function pdfToImages(
  sourceBytes: Uint8Array,
  format: PdfImageFormat = 'image/png',
  scale = 1.5,
): Promise<PdfPageImage[]> {
  if (typeof document === 'undefined') {
    throw new Error('Converting a PDF to images requires a browser with canvas support.');
  }

  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const loadingTask = pdfjsLib.getDocument({ data: sourceBytes });
  const pdf = await loadingTask.promise;

  try {
    const images: PdfPageImage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('This browser could not create a canvas to render the PDF.');
      }

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format),
      );
      if (!blob) {
        throw new Error(`Page ${pageNumber} could not be rendered to an image.`);
      }

      images.push({ pageNumber, bytes: new Uint8Array(await blob.arrayBuffer()) });
      page.cleanup();
    }

    return images;
  } finally {
    await loadingTask.destroy();
  }
}
