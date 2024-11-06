import React, { useState } from 'react';
import { Button, Input, Card } from '@nextui-org/react';
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[600px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  )
});

interface FormField {
  name: string;
  type: string;
  page: number;
  required: boolean;
  suggestedValue?: string;
}

export default function FormTemplate() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      // Clean up previous URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const response = await fetch('/api/analyze-form', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setFields(data.formFields);
      // Initialize values with suggested values
      const initialValues: Record<string, string> = {};
      data.formFields.forEach((field: FormField) => {
        initialValues[field.name] = field.suggestedValue || '';
      });
      setValues(initialValues);
      setFile(selectedFile);
      
      // Create URL for PDF preview
      const fileUrl = URL.createObjectURL(selectedFile);
      setPdfUrl(fileUrl);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreview = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('values', JSON.stringify(values));

    try {
      const response = await fetch('/api/fill-form', {
        method: 'POST',
        body: formData,
      });

      const blob = await response.blob();
      // Clean up previous URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('values', JSON.stringify(values));

    try {
      const response = await fetch('/api/fill-form', {
        method: 'POST',
        body: formData,
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full"
        />
      </div>

      {loading && (
        <div className="text-center p-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2">Analyzing form...</p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form Fields Section */}
          <Card className="p-4">
            <h2 className="text-xl font-bold mb-4">Form Fields</h2>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium">
                    {field.name} {field.required && '*'}
                  </label>
                  <Input
                    value={values[field.name] || ''}
                    onChange={(e) =>
                      setValues({...values, [field.name]: e.target.value})
                    }
                    placeholder={field.suggestedValue || `Enter ${field.name}`}
                    className="w-full"
                  />
                </div>
              ))}
              <Button 
                color="primary"
                onClick={handleUpdatePreview}
                className="w-full mt-4"
              >
                Update Preview
              </Button>
            </div>
          </Card>

          {/* PDF Preview Section */}
          <PDFViewer pdfUrl={pdfUrl} />
        </div>
      )}

      {fields.length > 0 && (
        <Button 
          color="success"
          onClick={handleDownload}
          className="mt-4 w-full"
        >
          Download Filled PDF
        </Button>
      )}
    </div>
  );
}