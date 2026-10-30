import { useState } from 'react';
import {
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Title1,
  Toolbar,
} from '@fluentui/react-components';
import {
  CheckmarkCircleRegular,
  DocumentCheckmarkRegular,
  ShieldLockRegular,
} from '@fluentui/react-icons';
import {
  isThemeMode,
  isWallpaper,
  useThemePreferences,
  wallpapers,
} from './ThemeProvider';
import {
  PdfFilePicker,
  type SelectedPdf,
} from '../components/PdfFilePicker/PdfFilePicker';
import { OpeningPasswordForm } from '../components/OpeningPasswordForm/OpeningPasswordForm';
import { DownloadResult } from '../components/DownloadResult/DownloadResult';
import { PdfPreview } from '../components/PdfPreview/PdfPreview';
import { PdfTools } from '../components/PdfTools/PdfTools';

export function App() {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProtectionProcessing, setIsProtectionProcessing] = useState(false);
  const [activePdfTools, setActivePdfTools] = useState(0);
  const isProcessing = isProtectionProcessing || activePdfTools > 0;
  const [resetToken, setResetToken] = useState(0);
  const [lifetimeEnabled, setLifetimeEnabled] = useState(false);
  const [lifetimeHours, setLifetimeHours] = useState(24);
  const {
    themeMode,
    setThemeMode,
    wallpaper,
    setWallpaper,
  } = useThemePreferences();
  const openingSecret = password;

  const handleSelect = (file: SelectedPdf | null) => {
    setSelectedPdf(file);
    setPassword('');
    setConfirmation('');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Toolbar aria-label="PDF Magik">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <DocumentMark />
            </span>
            <Text weight="semibold" size={500}>
              PDF Magik
            </Text>
          </div>
          <div className="top-actions">
            <Caption1 className="workbench-label">PDF Workbench</Caption1>
            <span className="privacy-pill">
              <ShieldLockRegular aria-hidden="true" />
              Files stay on this device
            </span>
            <div
              className="appearance-controls"
              role="group"
              aria-label="Appearance settings"
            >
              <label>
                <span>Theme</span>
                <select
                  aria-label="Color theme"
                  value={themeMode}
                  onChange={(event) => {
                    if (isThemeMode(event.currentTarget.value)) {
                      setThemeMode(event.currentTarget.value);
                    }
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="wallpaper-select-label">
                <span>Wallpaper</span>
                <select
                  aria-label="Background wallpaper"
                  value={wallpaper}
                  onChange={(event) => {
                    if (isWallpaper(event.currentTarget.value)) {
                      setWallpaper(event.currentTarget.value);
                    }
                  }}
                >
                  {Object.entries(wallpapers).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </Toolbar>
      </header>

      <main className="main">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <Caption1 className="eyebrow">Local PDF protection</Caption1>
            <Title1 id="page-title">Protect a PDF</Title1>
            <Body1 className="subtitle">
              Preview, protect, compress, add a page background, or merge PDFs. Processing
              happens in your browser.
            </Body1>
          </div>
          <div className="batch-badge">
            <CheckmarkCircleRegular aria-hidden="true" />
            Private · browser-based
          </div>
        </section>

        {fileError && (
          <MessageBar intent="error" className="file-error" role="alert">
            <MessageBarBody>
              <MessageBarTitle>Could not use that file</MessageBarTitle>
              {fileError}
            </MessageBarBody>
          </MessageBar>
        )}

        <div className="workspace">
          <div className="left-stack">
            <section aria-label="Selected PDF">
              <PdfFilePicker
                selectedPdf={selectedPdf}
                onSelect={handleSelect}
                onError={setFileError}
                processing={isProcessing}
              />
            </section>
            <section aria-label="PDF preview">
              <PdfPreview selectedPdf={selectedPdf} />
            </section>
          </div>

          <aside className="side-stack" aria-label="Password and download">
            <OpeningPasswordForm
              secret={openingSecret}
              confirmation={confirmation}
              onPasswordChange={setPassword}
              onConfirmationChange={setConfirmation}
            />
            <DownloadResult
              selectedPdf={selectedPdf}
              secret={openingSecret}
              confirmation={confirmation}
              lifetimeHours={lifetimeEnabled ? lifetimeHours : null}
              resetToken={resetToken}
              onProcessingChange={setIsProtectionProcessing}
              onClearPasswords={() => {
                setPassword('');
                setConfirmation('');
              }}
            />
          </aside>
        </div>

        <section className="pdf-tools-section" aria-label="PDF tools">
          <PdfTools
            selectedPdf={selectedPdf}
            processing={isProtectionProcessing}
            onProcessingChange={(started) =>
              setActivePdfTools((active) => Math.max(0, active + (started ? 1 : -1)))
            }
          />
        </section>

        <section className="lifetime-panel panel" aria-labelledby="lifetime-title">
          <label className="lifetime-toggle">
            <input
              type="checkbox"
              aria-label="Set an informational PDF lifetime reminder"
              checked={lifetimeEnabled}
              onChange={(event) => setLifetimeEnabled(event.currentTarget.checked)}
            />
            <span id="lifetime-title">Set a PDF lifetime reminder</span>
          </label>
          {lifetimeEnabled && (
            <div className="lifetime-controls">
              <label htmlFor="lifetime-hours">
                Reminder after <strong>{lifetimeHours} hours</strong>
              </label>
              <input
                id="lifetime-hours"
                className="lifetime-slider"
                type="range"
                min="1"
                max="720"
                step="1"
                value={lifetimeHours}
                aria-label={`Reminder after ${lifetimeHours} hours`}
                onChange={(event) => setLifetimeHours(event.currentTarget.valueAsNumber)}
              />
              <Caption1>
                Informational only: the app shows a reminder after export. It does not expire
                or delete the PDF.
              </Caption1>
            </div>
          )}
        </section>

        <Card className="bottom-note" appearance="filled-alternative">
          <CardHeader
            image={<ShieldLockRegular aria-hidden="true" />}
            header={
              <Text weight="semibold">Your PDF and password stay in your browser</Text>
            }
            description={
              <Caption1>
                This app does not upload documents. For sensitive files, verify the downloaded
                copy opens in your intended PDF reader.
              </Caption1>
            }
          />
        </Card>
        <Divider className="footer-divider" />
        <div className="footer-line">
          <Caption1>PDF Magik · A browser-based utility</Caption1>
          <Button
            appearance="subtle"
            size="small"
            disabled={isProcessing}
            onClick={() => {
              setSelectedPdf(null);
              setPassword('');
              setConfirmation('');
              setFileError(null);
              setLifetimeEnabled(false);
              setLifetimeHours(24);
              setResetToken((token) => token + 1);
            }}
          >
            Clear this session
          </Button>
        </div>
        <footer className="copyright">
          <Caption1>@2026 all rights reserved - Engr. Imaad Ullah Khan Yameen</Caption1>
        </footer>
      </main>
    </div>
  );
}

function DocumentMark() {
  return <DocumentCheckmarkRegular aria-hidden="true" />;
}
