import { useEffect, useState } from 'react';
import { Caption1, Card, CardHeader, Text } from '@fluentui/react-components';
import type { SelectedPdf } from '../PdfFilePicker/PdfFilePicker';

interface PdfPreviewProps {
  selectedPdf: SelectedPdf | null;
}

export function PdfPreview({ selectedPdf }: PdfPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPdf) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedPdf.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedPdf]);

  return (
    <Card className="panel preview-panel" appearance="filled">
      <CardHeader
        header={<Text weight="semibold">PDF preview</Text>}
        description={<Caption1>Preview updates automatically when you choose a PDF.</Caption1>}
      />
      {previewUrl ? (
        <iframe
          className="pdf-preview-frame"
          src={previewUrl}
          title="PDF preview"
        />
      ) : (
        <div className="pdf-preview-empty">
          <Caption1>Select a PDF to preview its pages here.</Caption1>
        </div>
      )}
    </Card>
  );
}
