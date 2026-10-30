import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import {
  Button,
  Body1,
  Caption1,
  Card,
  CardHeader,
  Spinner,
  Text,
} from '@fluentui/react-components';
import {
  ArrowUploadRegular,
  CheckmarkCircleRegular,
  DocumentPdfRegular,
  DismissCircleRegular,
} from '@fluentui/react-icons';
import {
  formatFileSize,
  getProtectedFilename,
  validatePdfFile,
  type BrowserFile,
} from '../../features/pdf-protection/browser-file';

export interface SelectedPdf {
  file: File;
  name: string;
  size: number;
}

interface PdfFilePickerProps {
  selectedPdf: SelectedPdf | null;
  onSelect: (file: SelectedPdf | null) => void;
  onError: (message: string | null) => void;
  processing: boolean;
}

export function PdfFilePicker({
  selectedPdf,
  onSelect,
  onError,
  processing,
}: PdfFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const selectFile = async (file?: File) => {
    if (!file || processing || isReading) return;
    onError(null);
    setIsReading(true);

    try {
      const validationError = await validatePdfFile(file as BrowserFile);
      if (validationError) {
        onSelect(null);
        onError(validationError);
        return;
      }

      onSelect({ file, name: file.name, size: file.size });
    } catch {
      onSelect(null);
      onError('The selected file could not be read. Check the file and try again.');
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFile(event.currentTarget.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void selectFile(event.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="panel selected-panel" appearance="filled">
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            Selected PDF
          </Text>
        }
        description={<Caption1>Processed on this device</Caption1>}
        action={
          selectedPdf ? (
            <Button
              appearance="subtle"
              size="small"
              disabled={processing || isReading}
              onClick={() => {
                onSelect(null);
                onError(null);
              }}
            >
              Choose another
            </Button>
          ) : undefined
        }
      />

      <div
        className={`dropzone${isDragging ? ' dropzone--active' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        aria-label="PDF selection area"
      >
        <span className="upload-icon" aria-hidden="true">
          <ArrowUploadRegular />
        </span>
        <div className="drop-copy">
          <Text weight="semibold">Choose one PDF to protect</Text>
          <Caption1>Select a file · no upload · original stays unchanged</Caption1>
        </div>
        <Button
          appearance="secondary"
          disabled={processing || isReading}
          onClick={() => inputRef.current?.click()}
        >
          Browse PDF
        </Button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/pdf,.pdf"
          disabled={processing || isReading}
          onChange={handleInputChange}
          aria-label="Choose a PDF file"
        />
      </div>

      {isReading ? (
        <Card className="file-state-card file-state-card--loading" appearance="filled-alternative">
          <Spinner size="tiny" label="Checking selected PDF" />
        </Card>
      ) : selectedPdf ? (
        <Card className="file-state-card file-state-card--selected" appearance="filled-alternative">
          <span className="pdf-icon" aria-hidden="true">
            <DocumentPdfRegular />
          </span>
          <div className="file-info">
            <Text className="file-name" title={selectedPdf.name}>
              {selectedPdf.name}
            </Text>
            <Caption1 className="file-meta">
              {formatFileSize(selectedPdf.size)} · Download name:{' '}
              {getProtectedFilename(selectedPdf.name)}
            </Caption1>
          </div>
          <span className="status status-ready">
            <CheckmarkCircleRegular />
            Ready
          </span>
        </Card>
      ) : (
        <Card className="file-state-card file-state-card--empty" appearance="filled-alternative">
          <span className="empty-file-icon" aria-hidden="true">
            <DocumentPdfRegular />
          </span>
          <div className="file-info">
            <Text weight="semibold">No PDF selected yet</Text>
            <Caption1>Choose or drop a PDF here to get started.</Caption1>
          </div>
          <DismissCircleRegular className="empty-state-mark" aria-hidden="true" />
        </Card>
      )}

      <div className="local-note">
        <CheckmarkCircleRegular aria-hidden="true" />
        <Body1>
          <Text weight="semibold">Local processing.</Text> The PDF is read and protected in your
          browser. The source file is never changed or uploaded.
        </Body1>
      </div>
    </Card>
  );
}
