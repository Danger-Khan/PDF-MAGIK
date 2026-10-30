import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Caption1,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  MessageBarActions,
  MessageBarTitle,
  Spinner,
  Text,
} from '@fluentui/react-components';
import { zip } from 'fflate';
import {
  ArrowDownloadRegular,
  CheckmarkCircleRegular,
  DocumentPdfRegular,
  ShieldLockRegular,
} from '@fluentui/react-icons';
import { getProtectedFilename } from '../../features/pdf-protection/browser-file';
import { runPdfTask } from '../../features/pdf-tools/pdf-task-client';
import { validatePasswords } from '../../features/pdf-protection/password-validation';
import type { SelectedPdf } from '../PdfFilePicker/PdfFilePicker';

interface DownloadResultProps {
  selectedPdfs: SelectedPdf[];
  secret: string;
  confirmation: string;
  lifetimeHours: number | null;
  resetToken: number;
  onProcessingChange: (processing: boolean) => void;
  onClearPasswords: () => void;
}

export function DownloadResult({
  selectedPdfs,
  secret,
  confirmation,
  lifetimeHours,
  resetToken,
  onProcessingChange,
  onClearPasswords,
}: DownloadResultProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadedFilename, setDownloadedFilename] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [lifetimeReminderDate, setLifetimeReminderDate] = useState<Date | null>(null);
  const processingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const filename = selectedPdfs.length > 0 ? 'pdf-magik-protected.zip' : null;
  const passwordErrors = validatePasswords(secret, confirmation);
  const submitErrors = [
    selectedPdfs.length === 0 ? 'Select at least one PDF to include in the ZIP.' : null,
    passwordErrors.passwordError ?? null,
    passwordErrors.confirmationError ?? null,
  ].filter((message): message is string => message !== null);

  useEffect(() => {
    setAttemptedSubmit(false);
    setErrorMessage(null);
    setDownloadedFilename(null);
    setLifetimeReminderDate(null);
    setProgressMessage(null);
  }, [resetToken, selectedPdfs]);

  const downloadArchive = (bytes: Uint8Array, outputName: string) => {
    const blobBytes = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([blobBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outputName;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const protectAndDownload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttemptedSubmit(true);
    setErrorMessage(null);
    setDownloadedFilename(null);
    setLifetimeReminderDate(null);
    setProgressMessage(null);

    if (processingRef.current || selectedPdfs.length === 0 || Object.keys(passwordErrors).length > 0) return;

    processingRef.current = true;
    setIsProcessing(true);
    onProcessingChange(true);

    try {
      const reminderDate = lifetimeHours === null
        ? null
        : new Date(Date.now() + lifetimeHours * 60 * 60 * 1000);
      const archiveEntries: Record<string, Uint8Array> = {};
      const usedNames = new Set<string>();

      for (const [index, pdf] of selectedPdfs.entries()) {
        setProgressMessage(`Protecting ${index + 1} of ${selectedPdfs.length}: ${pdf.name}`);
        const sourceBytes = new Uint8Array(await pdf.file.arrayBuffer());
        let protectedBytes: Uint8Array;

        try {
          protectedBytes = await runPdfTask({
            operation: 'protect',
            source: sourceBytes.buffer.slice(
              sourceBytes.byteOffset,
              sourceBytes.byteOffset + sourceBytes.byteLength,
            ) as ArrayBuffer,
            password: secret,
          });
        } catch {
          throw new Error(
            `Could not protect "${pdf.name}". No ZIP was created. The PDF may be encrypted already, damaged, PDF/A, or use features this browser tool cannot preserve.`,
          );
        }

        archiveEntries[getUniqueArchiveName(getProtectedFilename(pdf.name), usedNames)] =
          protectedBytes;
      }

      setProgressMessage('Preparing the ZIP archive…');
      const archiveBytes = await createZipArchive(archiveEntries);
      const archiveFilename = 'pdf-magik-protected.zip';
      downloadArchive(archiveBytes, archiveFilename);
      setDownloadedFilename(archiveFilename);
      setLifetimeReminderDate(reminderDate);
      onClearPasswords();
      setAttemptedSubmit(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The protected ZIP could not be created. No original PDFs were changed.',
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setProgressMessage(null);
      onProcessingChange(false);
    }
  };

  return (
    <Card className="panel output-panel" appearance="filled" aria-busy={isProcessing}>
      <CardHeader
        header={
          <div className="section-title">
            <ArrowDownloadRegular aria-hidden="true" />
            <Text weight="semibold" size={400}>
              Protected PDF ZIP download
            </Text>
          </div>
        }
        description={<Caption1>Checked PDFs are protected and saved together in one ZIP.</Caption1>}
      />

      <div className="output-content">
        <div className={`output-path${filename ? '' : ' output-path--empty'}`}>
          <span className="pdf-icon" aria-hidden="true">
            <DocumentPdfRegular />
          </span>
          <Text className="path-text" title={filename ?? undefined}>
            {filename ?? 'Your protected file will appear here'}
          </Text>
        </div>

        {attemptedSubmit && submitErrors.length > 0 && (
          <MessageBar intent="warning" className="result-message" role="alert">
            <MessageBarBody>
              <MessageBarTitle>Check before protecting</MessageBarTitle>
              <ul>
                {submitErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </MessageBarBody>
          </MessageBar>
        )}

        {errorMessage && (
          <MessageBar intent="error" className="result-message">
            <MessageBarBody>
              <MessageBarTitle>Could not create the protected ZIP</MessageBarTitle>
              {errorMessage}
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <Button
                  appearance="secondary"
                  size="small"
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  Try again
                </Button>
              }
            />
          </MessageBar>
        )}

        {downloadedFilename && (
          <MessageBar intent="success" className="result-message">
            <MessageBarBody>
              <MessageBarTitle>Protected ZIP downloaded</MessageBarTitle>
              {selectedPdfs.length} protected PDF
              {selectedPdfs.length === 1 ? '' : 's'} included: {downloadedFilename}
              {lifetimeReminderDate && (
                <div>
                  Informational reminder: {lifetimeReminderDate.toLocaleString()}
                </div>
              )}
            </MessageBarBody>
          </MessageBar>
        )}

        <form ref={formRef} onSubmit={protectAndDownload} noValidate>
          <Button
            className="protect-button"
            appearance="primary"
            type="submit"
            icon={isProcessing ? <Spinner size="tiny" /> : <ShieldLockRegular />}
            disabled={isProcessing}
            aria-describedby="download-disclosure"
          >
            {isProcessing ? 'Creating protected ZIP…' : 'Protect & download ZIP'}
          </Button>
        </form>

        {progressMessage && (
          <Caption1 className="batch-progress" role="status" aria-live="polite">
            {progressMessage}
          </Caption1>
        )}
        <Caption1 id="download-disclosure" className="download-disclosure">
          Selected PDFs use the same AES-256 password and are saved together in one ZIP. Your
          originals are never changed.
        </Caption1>
      </div>
    </Card>
  );
}

function createZipArchive(entries: Record<string, Uint8Array>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(entries, { level: 0 }, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });
}

function getUniqueArchiveName(filename: string, usedNames: Set<string>): string {
  const safeName =
    filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'protected.pdf';
  if (!usedNames.has(safeName)) {
    usedNames.add(safeName);
    return safeName;
  }

  const extensionIndex = safeName.toLowerCase().lastIndexOf('.pdf');
  const baseName = extensionIndex === safeName.length - 4
    ? safeName.slice(0, extensionIndex)
    : safeName;
  let suffix = 2;
  let candidate = `${baseName} (${suffix}).pdf`;
  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${baseName} (${suffix}).pdf`;
  }
  usedNames.add(candidate);
  return candidate;
}
