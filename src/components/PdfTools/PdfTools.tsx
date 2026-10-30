import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Text,
} from '@fluentui/react-components';
import type { SelectedPdf } from '../PdfFilePicker/PdfFilePicker';
import { runPdfTask } from '../../features/pdf-tools/pdf-task-client';
import {
  formatFileSize,
  getToolOutputFilename,
} from '../../features/pdf-protection/browser-file';

interface PdfToolsProps {
  selectedPdf: SelectedPdf | null;
  processing: boolean;
  onProcessingChange: (started: boolean) => void;
}

type Operation = 'compress' | 'background' | 'merge';
type OperationStatus = {
  running: boolean;
  message: string | null;
  error: string | null;
};

const emptyStatuses: Record<Operation, OperationStatus> = {
  compress: { running: false, message: null, error: null },
  background: { running: false, message: null, error: null },
  merge: { running: false, message: null, error: null },
};

export function PdfTools({
  selectedPdf,
  processing,
  onProcessingChange,
}: PdfToolsProps) {
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [statuses, setStatuses] = useState(emptyStatuses);
  const activeOperations = useRef(new Set<Operation>());

  useEffect(() => {
    setBackgroundFile(null);
    setMergeFiles([]);
    setStatuses(emptyStatuses);
  }, [selectedPdf?.file]);

  const downloadResult = (bytes: Uint8Array, filename: string) => {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const runOperation = async (
    operationName: Operation,
    operation: () => Promise<{ bytes: Uint8Array; filename: string; message: string }>,
  ) => {
    if (activeOperations.current.has(operationName)) return;
    activeOperations.current.add(operationName);
    setStatuses((current) => ({
      ...current,
      [operationName]: { running: true, message: null, error: null },
    }));
    onProcessingChange(true);

    try {
      const result = await operation();
      downloadResult(result.bytes, result.filename);
      setStatuses((current) => ({
        ...current,
        [operationName]: { running: true, message: result.message, error: null },
      }));
    } catch (operationError) {
      setStatuses((current) => ({
        ...current,
        [operationName]: {
          running: true,
          message: null,
          error:
            operationError instanceof Error
              ? operationError.message
              : 'The PDF could not be processed. Check the file and try again.',
        },
      }));
    } finally {
      activeOperations.current.delete(operationName);
      setStatuses((current) => ({
        ...current,
        [operationName]: { ...current[operationName], running: false },
      }));
      onProcessingChange(false);
    }
  };

  const handleCompress = () => {
    if (!selectedPdf) return;

    void runOperation('compress', async () => {
      const bytes = await runPdfTask({
        operation: 'compress',
        source: await selectedPdf.file.arrayBuffer(),
      });
      const saved = selectedPdf.size - bytes.byteLength;
      const message =
        saved > 0
          ? `Compressed copy downloaded (${formatFileSize(saved)} smaller).`
          : `Optimized copy downloaded (${formatFileSize(bytes.byteLength)}). This PDF did not get smaller after rewriting.`;
      return {
        bytes,
        filename: getToolOutputFilename(selectedPdf.name, 'compressed'),
        message,
      };
    });
  };

  const handleBackground = () => {
    if (!selectedPdf || !backgroundFile) return;
    const imageType = getImageType(backgroundFile);
    if (!imageType) {
      setStatuses((current) => ({
        ...current,
        background: {
          ...current.background,
          error: 'Choose a JPG or PNG image to use as the page background.',
          message: null,
        },
      }));
      return;
    }

    void runOperation('background', async () => ({
      bytes: await runPdfTask({
        operation: 'background',
        source: await selectedPdf.file.arrayBuffer(),
        image: await backgroundFile.arrayBuffer(),
        imageType,
      }),
      filename: getToolOutputFilename(selectedPdf.name, 'background'),
      message: 'PDF with the selected image on every page downloaded.',
    }));
  };

  const handleMerge = () => {
    if (!selectedPdf) return;
    if (mergeFiles.length === 0) {
      setStatuses((current) => ({
        ...current,
        merge: {
          ...current.merge,
          error: 'Choose at least one additional PDF to merge with the selected PDF.',
          message: null,
        },
      }));
      return;
    }

    void runOperation('merge', async () => {
      const files = await Promise.all([selectedPdf.file, ...mergeFiles].map(async (file) => ({
        name: file.name,
        bytes: await file.arrayBuffer(),
      })));
      const bytes = await runPdfTask({
        operation: 'merge',
        files,
      });
      return {
        bytes,
        filename: getToolOutputFilename(selectedPdf.name, 'merged'),
        message: `${mergeFiles.length + 1} PDFs merged and downloaded.`,
      };
    });
  };

  const updateBackgroundFile = (event: ChangeEvent<HTMLInputElement>) => {
    setBackgroundFile(event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = '';
  };

  const updateMergeFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setMergeFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  };

  return (
    <Card className="panel pdf-tools-panel" appearance="filled">
      <CardHeader
        header={<Text weight="semibold">PDF tools</Text>}
        description={<Caption1>Transform a copy of your selected PDF locally.</Caption1>}
      />
      <div className="pdf-tools-grid">
        <section className="pdf-tool" aria-labelledby="compress-tool-title">
          <Text id="compress-tool-title" weight="semibold">Compress PDF</Text>
          <Caption1>
            Rewrites the PDF with compact object streams. Size savings vary by document.
          </Caption1>
          <Button
            appearance="secondary"
            disabled={!selectedPdf || processing || statuses.compress.running}
            onClick={handleCompress}
          >
            {statuses.compress.running ? 'Compressing…' : 'Compress PDF'}
          </Button>
          <OperationFeedback status={statuses.compress} />
        </section>

        <section className="pdf-tool" aria-labelledby="background-tool-title">
          <Text id="background-tool-title" weight="semibold">Add page background</Text>
          <Caption1>Place a JPG or PNG image behind the content on every page.</Caption1>
          <input
            ref={backgroundInputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            aria-label="Choose background image"
            onChange={updateBackgroundFile}
          />
          <Button
            appearance="secondary"
            disabled={!selectedPdf || processing || statuses.background.running}
            onClick={() => backgroundInputRef.current?.click()}
          >
            Choose background image
          </Button>
          {backgroundFile && <Caption1>{backgroundFile.name}</Caption1>}
          <Button
            appearance="primary"
            disabled={!selectedPdf || !backgroundFile || processing || statuses.background.running}
            onClick={handleBackground}
          >
            {statuses.background.running ? 'Adding background…' : 'Add background to PDF'}
          </Button>
          <OperationFeedback status={statuses.background} />
        </section>

        <section className="pdf-tool" aria-labelledby="merge-tool-title">
          <Text id="merge-tool-title" weight="semibold">Merge PDFs</Text>
          <Caption1>Combine the selected PDF first, followed by the additional files.</Caption1>
          <input
            ref={mergeInputRef}
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            aria-label="Choose additional PDFs to merge"
            onChange={updateMergeFiles}
          />
          <Button
            appearance="secondary"
            disabled={!selectedPdf || processing || statuses.merge.running}
            onClick={() => mergeInputRef.current?.click()}
          >
            Choose PDFs to add
          </Button>
          {mergeFiles.length > 0 && (
            <Caption1>
              {mergeFiles.length} additional PDF{mergeFiles.length === 1 ? '' : 's'} selected
            </Caption1>
          )}
          <Button
            appearance="primary"
            disabled={!selectedPdf || mergeFiles.length === 0 || processing || statuses.merge.running}
            onClick={handleMerge}
          >
            {statuses.merge.running ? 'Merging…' : 'Merge PDFs'}
          </Button>
          <OperationFeedback status={statuses.merge} />
        </section>
      </div>
    </Card>
  );
}

function OperationFeedback({ status }: { status: OperationStatus }) {
  if (!status.error && !status.message) return null;
  return (
    <Body1
      className={status.error ? 'pdf-tool-status pdf-tool-status--error' : 'pdf-tool-status'}
      role={status.error ? 'alert' : 'status'}
    >
      {status.error ?? status.message}
    </Body1>
  );
}

function getImageType(file: File): 'image/jpeg' | 'image/png' | null {
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    return file.type;
  }

  const extension = file.name.toLowerCase().split('.').pop();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  return null;
}
