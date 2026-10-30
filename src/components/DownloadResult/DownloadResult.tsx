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
  selectedPdf: SelectedPdf | null;
  secret: string;
  confirmation: string;
  lifetimeHours: number | null;
  resetToken: number;
  onProcessingChange: (processing: boolean) => void;
  onClearPasswords: () => void;
}

export function DownloadResult({
  selectedPdf,
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
  const [lifetimeReminderDate, setLifetimeReminderDate] = useState<Date | null>(null);
  const processingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const filename = selectedPdf ? getProtectedFilename(selectedPdf.name) : null;
  const passwordErrors = validatePasswords(secret, confirmation);
  const submitErrors = [
    !selectedPdf ? 'Choose one PDF before protecting it.' : null,
    passwordErrors.passwordError ?? null,
    passwordErrors.confirmationError ?? null,
  ].filter((message): message is string => message !== null);

  useEffect(() => {
    setAttemptedSubmit(false);
    setErrorMessage(null);
    setDownloadedFilename(null);
    setLifetimeReminderDate(null);
  }, [resetToken, selectedPdf]);

  const downloadProtectedPdf = (bytes: Uint8Array, outputName: string) => {
    const blobBytes = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([blobBytes], { type: 'application/pdf' });
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

    if (processingRef.current || !selectedPdf || Object.keys(passwordErrors).length > 0) return;

    processingRef.current = true;
    setIsProcessing(true);
    onProcessingChange(true);

    try {
      const reminderDate = lifetimeHours === null
        ? null
        : new Date(Date.now() + lifetimeHours * 60 * 60 * 1000);
      const sourceBytes = new Uint8Array(await selectedPdf.file.arrayBuffer());
      const protectedBytes = await runPdfTask({
        operation: 'protect',
        source: sourceBytes.buffer.slice(
          sourceBytes.byteOffset,
          sourceBytes.byteOffset + sourceBytes.byteLength,
        ) as ArrayBuffer,
        password: secret,
      });
      downloadProtectedPdf(protectedBytes, getProtectedFilename(selectedPdf.name));
      setDownloadedFilename(getProtectedFilename(selectedPdf.name));
      setLifetimeReminderDate(reminderDate);
      onClearPasswords();
      setAttemptedSubmit(false);
    } catch {
      setErrorMessage(
        'We could not protect this PDF. It may be encrypted already, damaged, PDF/A, or use features this browser tool cannot preserve. The original file is unchanged.',
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
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
              Protected PDF download
            </Text>
          </div>
        }
        description={<Caption1>The protected copy downloads to your device.</Caption1>}
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
              <MessageBarTitle>Could not protect this PDF</MessageBarTitle>
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
              <MessageBarTitle>Protected PDF downloaded</MessageBarTitle>
              {downloadedFilename}
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
            {isProcessing ? 'Protecting PDF…' : 'Protect & download'}
          </Button>
        </form>

        <Caption1 id="download-disclosure" className="download-disclosure">
          Uses AES-256. Reader compatibility varies. Your original PDF is never overwritten.
        </Caption1>
      </div>
    </Card>
  );
}
