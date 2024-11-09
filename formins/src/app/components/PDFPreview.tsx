import React, { useState, useCallback, memo, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface FormField {
  name: string;
  type: string;
  page: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isSignature?: boolean;
  isCheckbox?: boolean;
}

interface PDFPreviewProps {
  file: File | null;
  fields: FormField[];
  onFieldClick?: (field: FormField) => void;
}

const PDFPreview = memo(({ file, fields, onFieldClick }: PDFPreviewProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Create and cleanup URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [file]);

  const onPageLoadSuccess = useCallback((page: any) => {
    setPageHeight(page.height);
  }, []);

  const getFieldPosition = useCallback((field: FormField) => {
    if (!field.bounds || !pageHeight) return null;
    
    return {
      left: field.bounds.x,
      top: pageHeight - field.bounds.y - field.bounds.height,
      width: field.bounds.width,
      height: field.bounds.height
    };
  }, [pageHeight]);

  return (
    <Card className="p-4 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="bordered"
            onClick={() => setCurrentPage(page => Math.min(page + 1, numPages))}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-auto">
        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            className="mx-auto"
          >
            <Page
              pageNumber={currentPage}
              scale={1}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onLoadSuccess={onPageLoadSuccess}
              className="relative"
            >
              {fields
                .filter(field => field.page === currentPage && field.bounds)
                .map((field, index) => {
                  const position = getFieldPosition(field);
                  if (!position) return null;

                  return (
                    <div
                      key={`${field.name}-${index}`}
                      className="absolute cursor-pointer transition-all duration-200"
                      style={{
                        left: position.left,
                        top: position.top,
                        width: position.width,
                        height: position.height,
                        backgroundColor: field.isSignature ? 'rgba(255, 0, 0, 0.2)' :
                          field.isCheckbox ? 'rgba(0, 255, 0, 0.2)' :
                            'rgba(0, 0, 255, 0.2)',
                        border: hoveredField === field.name ? '2px solid #000' : '1px solid rgba(0,0,0,0.2)',
                      }}
                      onClick={() => onFieldClick?.(field)}
                      onMouseEnter={() => setHoveredField(field.name)}
                      onMouseLeave={() => setHoveredField(null)}
                    >
                      {hoveredField === field.name && (
                        <div className="absolute bottom-full left-0 bg-black text-white text-xs p-1 rounded mb-1 whitespace-nowrap z-10">
                          {field.name}
                        </div>
                      )}
                    </div>
                  );
                })}
            </Page>
          </Document>
        )}
      </div>
    </Card>
  );
});

PDFPreview.displayName = 'PDFPreview';

export default PDFPreview;