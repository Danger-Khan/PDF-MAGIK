import { validatePdfFile } from '../pdf-protection/browser-file';

export async function compressPdf(sourceBytes: Uint8Array): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const document = await PDFDocument.load(sourceBytes, { updateMetadata: false });
  return document.save({ rewrite: true, useObjectStreams: true });
}

export async function addImageBackground(
  sourceBytes: Uint8Array,
  imageBytes: Uint8Array,
  imageType: 'image/jpeg' | 'image/png',
): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const source = await PDFDocument.load(sourceBytes, { updateMetadata: false });
  const background = await PDFDocument.create();
  const image =
    imageType === 'image/png'
      ? await background.embedPng(imageBytes)
      : await background.embedJpg(imageBytes);
  const sourcePages = source.getPages();
  const pagesWithContent = sourcePages.filter((page) => page.node.Contents() !== undefined);
  const embeddedPages = await background.embedPages(pagesWithContent);
  let embeddedPageIndex = 0;

  sourcePages.forEach((sourcePage, index) => {
    const width = sourcePage.getWidth();
    const height = sourcePage.getHeight();
    const page = background.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    if (sourcePage.node.Contents() !== undefined) {
      page.drawPage(embeddedPages[embeddedPageIndex], { x: 0, y: 0, width, height });
      embeddedPageIndex += 1;
    }
  });

  return background.save({ rewrite: true, useObjectStreams: true });
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error('Choose at least two PDFs to merge.');
  }

  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const merged = await PDFDocument.create();
  for (const file of files) {
    const validationError = await validatePdfFile(file);
    if (validationError) {
      throw new Error(`${file.name}: ${validationError}`);
    }

    const source = await PDFDocument.load(await file.arrayBuffer(), {
      updateMetadata: false,
    });
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return merged.save({ rewrite: true, useObjectStreams: true });
}
