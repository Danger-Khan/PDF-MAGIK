import { useEffect, useState } from 'react';
import { Caption1, Card, CardHeader, Text } from '@fluentui/react-components';
import type { SelectedPdf } from '../PdfFilePicker/PdfFilePicker';

interface PdfPreviewProps {
  selectedPdfs: SelectedPdf[];
}

interface PdfPreviewUrl {
  file: File;
  url: string;
}

export function PdfPreview({ selectedPdfs }: PdfPreviewProps) {
  const [previewUrls, setPreviewUrls] = useState<PdfPreviewUrl[]>([]);

  useEffect(() => {
    const urls = selectedPdfs.map(({ file }) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviewUrls(urls);
    return () => urls.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [selectedPdfs]);

  return (
    <Card className="panel preview-panel" appearance="filled">
      <CardHeader
        header={<Text weight="semibold">PDF preview</Text>}
        description={
          <Caption1>
            Previewing {selectedPdfs.length} included PDF
            {selectedPdfs.length === 1 ? '' : 's'}.
          </Caption1>
        }
      />
      {previewUrls.length > 0 ? (
        <div className="pdf-preview-list">
          {previewUrls.map(({ file, url }) => (
            <section
              className="pdf-preview-item"
              key={`${file.name}-${file.size}-${file.lastModified}`}
              aria-label={`Preview of ${file.name}`}
            >
              <Text className="pdf-preview-name" title={file.name} weight="semibold">
                {file.name}
              </Text>
              <iframe
                className="pdf-preview-frame"
                src={url}
                title={`PDF preview: ${file.name}`}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="pdf-preview-empty">
          <Caption1>Select PDFs and check the ones you want to preview.</Caption1>
        </div>
      )}
    </Card>
  );
}
