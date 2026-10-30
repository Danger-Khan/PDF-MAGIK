import { executePdfTask, type PdfTaskRequest } from './pdf-task';

interface WorkerGlobal {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<PdfTaskRequest>) => void,
  ): void;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const workerGlobal = globalThis as unknown as WorkerGlobal;

workerGlobal.addEventListener('message', (event) => {
  void executePdfTask(event.data)
    .then((bytes) => {
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      workerGlobal.postMessage({ result: buffer }, [buffer]);
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'PDF processing failed.';
      workerGlobal.postMessage({ error: message }, []);
    });
});
