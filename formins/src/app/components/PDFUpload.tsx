// app/components/PDFUpload.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@nextui-org/react';

interface FormField {
  fieldName: string;
  fieldValue: string;
}

interface ProcessedData {
  date?: string;
  fileRef?: string;
  [key: string]: string | undefined;
}

export default function PDFUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFormFields = (fields: FormField[]) => {
    const data: ProcessedData = {};
    
    fields.forEach(field => {
      const normalizedFieldName = field.fieldName.toLowerCase().trim().replace(/[.:]/g, '');
      
      if (normalizedFieldName.includes('date')) {
        data.date = field.fieldValue.trim();
      }
      else if (normalizedFieldName.includes('file ref')) {
        data.fileRef = field.fieldValue.trim();
      }
      // to add more field mappings
    });

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setProcessedData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process PDF');
      }

      setFields(data.formFields);
      const processed = processFormFields(data.formFields);
      setProcessedData(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        
        <Button
          color="primary"
          isLoading={loading}
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? 'Processing...' : 'Process PDF'}
        </Button>
      </div>

      {error && (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {processedData && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Processed Form Data</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4">
                <h3 className="font-medium mb-2">Date</h3>
                <p>{processedData.date || 'Not found'}</p>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-2">File Reference</h3>
                <p>{processedData.fileRef || 'Not found'}</p>
              </div>
            </div>
            
            {/* Raw Extracted Fields */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-3">Raw Extracted Fields</h3>
              <div className="grid gap-2">
                {fields.map((field, index) => (
                  <div key={index} className="flex p-3 rounded-md">
                    <span className="font-medium w-1/3">{field.fieldName}</span>
                    <span className="w-2/3">{field.fieldValue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}