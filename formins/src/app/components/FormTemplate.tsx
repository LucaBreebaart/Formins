// app/components/FormTemplate.tsx
'use client';

import React, { useState } from 'react';
import { Button, Input, Card } from '@nextui-org/react';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
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
      setFile(file);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = async () => {
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
    <div className="max-w-4xl mx-auto p-4">
      <Card className="p-6">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="mb-4"
        />

        {loading && <div>Analyzing form...</div>}

        {fields.length > 0 && (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.name} {field.required && '*'}
                </label>
                <Input
                  value={values[field.name] || ''}
                  onChange={(e) => 
                    setValues({...values, [field.name]: e.target.value})
                  }
                  placeholder={field.suggestedValue || `Enter ${field.name}`}
                />
              </div>
            ))}
            <Button onClick={handleFillForm} color="primary">
              Fill and Download PDF
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}