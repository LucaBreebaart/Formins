// app/components/PDFUpload.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@nextui-org/react';

interface FormField {
  fieldName: string;
  fieldValue: string;
}

export default function PDFUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
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

      {fields.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Extracted Fields</h2>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={index} className="flex border-b py-2">
                <span className="font-medium w-1/3">{field.fieldName}:</span>
                <span className="w-2/3">{field.fieldValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}