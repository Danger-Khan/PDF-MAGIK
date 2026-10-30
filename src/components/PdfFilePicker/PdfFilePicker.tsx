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
  included: boolean;
}

interface PdfFilePickerProps {
  selectedPdfs: SelectedPdf[];
  onSelect: (files: SelectedPdf[]) => void;
  onError: (message: string | null) => void;
  processing: boolean;
}

export function PdfFilePicker({
  selectedPdfs,
  onSelect,
  onError,
  processing,
}: PdfFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const selectFiles = async (files: File[]) => {
    if (files.length === 0 || processing || isReading) return;
    onError(null);
    setIsReading(true);

    try {
      const selectedKeys = new Set(
        selectedPdfs.map(({ file }) => getFileKey(file)),
      );
      const additions: SelectedPdf[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const key = getFileKey(file);
        if (selectedKeys.has(key)) {
          errors.push(`${file.name}: this PDF is already in the batch.`);
          continue;
        }

        const validationError = await validatePdfFile(file as BrowserFile);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        selectedKeys.add(key);
        additions.push({ file, name: file.name, size: file.size, included: true });
      }

      if (additions.length > 0) onSelect([...selectedPdfs, ...additions]);
      onError(errors.length > 0 ? errors.join(' ') : null);
    } catch {
      onError('The selected file could not be read. Check the file and try again.');
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFiles(Array.from(event.currentTarget.files ?? []));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void selectFiles(Array.from(event.dataTransfer.files));
    }
  };
  const includedCount = selectedPdfs.filter((pdf) => pdf.included).length;

  return (
    <Card className="panel selected-panel" appearance="filled">
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            PDF batch
          </Text>
        }
        description={<Caption1>Processed on this device</Caption1>}
        action={
          selectedPdfs.length > 0 ? (
            <Button
              appearance="subtle"
              size="small"
              disabled={processing || isReading}
              onClick={() => {
                onSelect([]);
                onError(null);
              }}
            >
              Clear PDFs
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
          <Text weight="semibold">Add PDFs to protect</Text>
          <Caption1>Select multiple files · checked PDFs go into the ZIP</Caption1>
        </div>
        <Button
          appearance="secondary"
          disabled={processing || isReading}
          onClick={() => inputRef.current?.click()}
        >
          Browse PDFs
        </Button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          disabled={processing || isReading}
          onChange={handleInputChange}
          aria-label="Choose PDF files"
        />
      </div>

      {isReading ? (
        <Card className="file-state-card file-state-card--loading" appearance="filled-alternative">
          <Spinner size="tiny" label="Checking selected PDF" />
        </Card>
      ) : selectedPdfs.length > 0 ? (
        <div className="batch-file-list" aria-label="PDFs in batch">
          {selectedPdfs.map((pdf, index) => (
            <Card
              className="file-state-card file-state-card--selected"
              appearance="filled-alternative"
              key={`${getFileKey(pdf.file)}-${index}`}
            >
              <label className="batch-file-checkbox">
                <input
                  type="checkbox"
                  aria-label={`Include ${pdf.name} in protected ZIP`}
                  checked={pdf.included}
                  disabled={processing || isReading}
                  onChange={(event) => {
                    onSelect(
                      selectedPdfs.map((item) =>
                        item.file === pdf.file
                          ? { ...item, included: event.currentTarget.checked }
                          : item,
                      ),
                    );
                  }}
                />
              </label>
              <span className="pdf-icon" aria-hidden="true">
                <DocumentPdfRegular />
              </span>
              <div className="file-info">
                <Text className="file-name" title={pdf.name}>
                  {pdf.name}
                </Text>
                <Caption1 className="file-meta">
                  {formatFileSize(pdf.size)} · {getProtectedFilename(pdf.name)}
                </Caption1>
              </div>
              <span className="status status-ready">
                <CheckmarkCircleRegular />
                Ready
              </span>
            </Card>
          ))}
          <div className="batch-file-actions">
            <Button
              appearance="subtle"
              size="small"
              disabled={processing || includedCount === selectedPdfs.length}
              onClick={() =>
                onSelect(selectedPdfs.map((pdf) => ({ ...pdf, included: true })))
              }
            >
              Include all
            </Button>
            <Button
              appearance="subtle"
              size="small"
              disabled={processing || includedCount === 0}
              onClick={() =>
                onSelect(selectedPdfs.map((pdf) => ({ ...pdf, included: false })))
              }
            >
              Include none
            </Button>
            <Caption1 role="status">
              {includedCount} of {selectedPdfs.length} included in ZIP
            </Caption1>
          </div>
        </div>
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
          <Text weight="semibold">Local processing.</Text> PDFs are protected in your browser.
          Only checked files are included in the downloaded ZIP; originals stay unchanged and
          are never uploaded.
        </Body1>
      </div>
    </Card>
  );
}

function getFileKey(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
}
