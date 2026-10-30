import { executePdfTask, type PdfTaskRequest } from './pdf-task';

export async function runPdfTask(request: PdfTaskRequest): Promise<Uint8Array> {
  if (typeof Worker === 'undefined') {
    return executePdfTask(request);
  }

  const worker = new Worker(new URL('./pdf-tools.worker.ts', import.meta.url), {
    type: 'module',
  });

  return new Promise((resolve, reject) => {
    worker.addEventListener('message', (event: MessageEvent<{
      result?: ArrayBuffer;
      error?: string;
    }>) => {
      worker.terminate();
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else if (event.data.result) {
        resolve(new Uint8Array(event.data.result));
      } else {
        reject(new Error('The PDF worker returned an empty result.'));
      }
    }, { once: true });

    worker.addEventListener('error', (event) => {
      worker.terminate();
      reject(new Error(event.message || 'The PDF worker stopped unexpectedly.'));
    }, { once: true });

    const transferables = getTransferables(request);
    worker.postMessage(request, transferables);
  });
}

function getTransferables(request: PdfTaskRequest): Transferable[] {
  switch (request.operation) {
    case 'compress':
    case 'protect':
      return [request.source];
    case 'background':
      return [request.source, request.image];
    case 'merge':
      return request.files.map(({ bytes }) => bytes);
  }
}
