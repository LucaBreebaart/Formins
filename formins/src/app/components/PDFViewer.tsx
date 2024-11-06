import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, Button } from '@nextui-org/react';
import dynamic from 'next/dynamic';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Dynamically import react-pdf components
const PDFDocument = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[600px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  )
});

const PDFPage = dynamic(() => import('react-pdf').then(mod => mod.Page), {
  ssr: false
});

interface PDFViewerProps {
  pdfUrl: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  };

  if (!pdfUrl) {
    return (
      <div className="flex justify-center items-center h-[600px] bg-gray-100 rounded-lg">
        <p className="text-gray-500">Upload a PDF to preview</p>
      </div>
    );
  }

  return (
    <Card className="p-4 w-full">
      <h2 className="text-xl font-bold mb-4">PDF Preview</h2>
      <div className="pdf-container border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <PDFDocument
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex justify-center items-center h-[600px]">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              }
              error={
                <div className="flex justify-center items-center h-full">
                  <p className="text-red-500">Error loading PDF</p>
                </div>
              }
            >
              <PDFPage
                pageNumber={currentPage}
                width={450}
                className="mx-auto"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex justify-center items-center h-[600px]">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                }
              />
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 bg-white p-2 sticky bottom-0">
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {numPages}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                    disabled={currentPage >= numPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </PDFDocument>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PDFViewer;