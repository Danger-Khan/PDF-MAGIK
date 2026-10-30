export type PdfTaskRequest =
  | { operation: 'compress'; source: ArrayBuffer }
  | {
      operation: 'background';
      source: ArrayBuffer;
      image: ArrayBuffer;
      imageType: 'image/jpeg' | 'image/png';
    }
  | {
      operation: 'merge';
      files: Array<{ name: string; bytes: ArrayBuffer }>;
    }
  | { operation: 'protect'; source: ArrayBuffer; password: string };

export async function executePdfTask(request: PdfTaskRequest): Promise<Uint8Array> {
  switch (request.operation) {
    case 'compress': {
      const { compressPdf } = await import('./pdf-tools');
      return compressPdf(new Uint8Array(request.source));
    }
    case 'background': {
      const { addImageBackground } = await import('./pdf-tools');
      return addImageBackground(
        new Uint8Array(request.source),
        new Uint8Array(request.image),
        request.imageType,
      );
    }
    case 'merge': {
      const { mergePdfs } = await import('./pdf-tools');
      const files = request.files.map(
        ({ name, bytes }) =>
          new File([bytes], name, { type: 'application/pdf' }),
      );
      return mergePdfs(files);
    }
    case 'protect': {
      const { protectPdf } = await import('../pdf-protection/protection-service');
      return protectPdf(new Uint8Array(request.source), request.password);
    }
  }
}
