// app/components/FormTemplate.tsx
import React, { useState, useRef } from 'react';
import { Button, Input, Card } from '@nextui-org/react';
import SignaturePad from 'react-signature-canvas';
// import 'react-signature-canvas/styles.css';

interface FormField {
  name: string;
  type: string;
  page: number;
  required: boolean;
  suggestedValue?: string;
  isSignature?: boolean;
}

type SignatureCanvas = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string) => string;
};

export default function FormTemplate() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const signatureRefs = useRef<{ [key: string]: SignatureCanvas }>({});

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
      
      // Check for signature fields case-insensitively
      const processedFields = data.formFields.map((field: FormField) => ({
        ...field,
        isSignature: field.name.toLowerCase().includes('signature') || 
                    field.name.toLowerCase().includes('signiture') ||
                    field.name.toLowerCase().includes('sign')
      }));

      setFields(processedFields);
      
      // Initialize values with suggested values
      const initialValues: Record<string, string> = {};
      processedFields.forEach((field: FormField) => {
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

    // Convert signatures to values before submitting
    const formValues = { ...values };
    fields.forEach(field => {
      if (field.isSignature && signatureRefs.current[field.name]) {
        const signatureCanvas = signatureRefs.current[field.name];
        if (!signatureCanvas.isEmpty()) {
          // Add a timestamp to ensure we're getting the latest signature
          formValues[field.name] = signatureCanvas.toDataURL('image/png');
        }
      }
    });

    console.log('Submitting values:', formValues); // Debug log

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('values', JSON.stringify(formValues));

    try {
      const response = await fetch('/api/fill-form', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fill form');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error filling form:', error);
    }
  };

  return (
    <div className="p-4">
      <Card className="p-6">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          className="mb-4"
        />

        {loading && <p>Analyzing form...</p>}

        {fields.length > 0 && (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="block text-sm font-medium">
                  {field.name} {field.required && '*'}
                </label>
                
                {field.isSignature ? (
                  <div className="border rounded p-2 bg-white">
                    <SignaturePad
                      ref={(ref) => {
                        if (ref) {
                          signatureRefs.current[field.name] = ref;
                        }
                      }}
                      canvasProps={{
                        className: 'signature-canvas',
                        width: 500,
                        height: 200,
                        style: {
                          width: '100%',
                          height: '200px',
                          maxWidth: '500px',
                          backgroundColor: '#fff'
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => signatureRefs.current[field.name]?.clear()}
                      className="mt-2"
                    >
                      Clear Signature
                    </Button>
                  </div>
                ) : (
                  <Input
                    value={values[field.name] || ''}
                    onChange={(e) => 
                      setValues({...values, [field.name]: e.target.value})
                    }
                    placeholder={field.suggestedValue || `Enter ${field.name}`}
                  />
                )}
              </div>
            ))}
            
            <Button onClick={handleFillForm} className="mt-4">
              Fill and Download PDF
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}