import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Checkbox } from '@nextui-org/react';
import SignaturePad from 'react-signature-canvas';
import PDFPreview from './PDFPreview';
import { FormField, SignatureCanvas } from '../types/form';
import { auth } from "@/app/firebase";
import { getUserProfile } from '../services/profileService';
import { UserProfile } from '../types/user';

export default function FormTemplate() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const signatureRefs = useRef<{ [key: string]: SignatureCanvas }>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, []);

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

      // Process fields to identify signatures and checkboxes
      const processedFields = data.formFields.map((field: FormField) => ({
        ...field,
        isSignature: field.name.toLowerCase().includes('signature') ||
          field.name.toLowerCase().includes('signiture') ||
          field.name.toLowerCase().includes('sign'),
        isCheckbox: field.type === 'PDFCheckBox' ||
          field.name.toLowerCase().includes('confirm') ||
          field.name.toLowerCase().includes('accept') ||
          field.name.toLowerCase().includes('understand')
      }));

      setFields(processedFields);

      // Initialise values with autofill data when available
      const initialValues: Record<string, any> = {};
      processedFields.forEach((field: FormField) => {
        const fieldNameLower = field.name.toLowerCase();

        // Handle checkboxes and signatures first
        if (field.isCheckbox) {
          initialValues[field.name] = false;
        } else if (field.isSignature) {
          initialValues[field.name] = '';
        } else if (userProfile) {
          // Autofill logic for text fields
          if (fieldNameLower.includes('name') || fieldNameLower.includes('full name')) {
            initialValues[field.name] = `${userProfile.firstName} ${userProfile.lastName}`;
          } else if (fieldNameLower.includes('first name')) {
            initialValues[field.name] = userProfile.firstName;
          } else if (fieldNameLower.includes('last name') || fieldNameLower.includes('surname')) {
            initialValues[field.name] = userProfile.lastName;
          } else if (fieldNameLower.includes('email')) {
            initialValues[field.name] = userProfile.email;
          } else if (fieldNameLower.includes('phone')) {
            initialValues[field.name] = userProfile.phoneNumber;
          } else if (fieldNameLower.includes('address')) {
            if (fieldNameLower.includes('street')) {
              initialValues[field.name] = userProfile.address.street;
            } else if (fieldNameLower.includes('city')) {
              initialValues[field.name] = userProfile.address.city;
            } else if (fieldNameLower.includes('state') || fieldNameLower.includes('province')) {
              initialValues[field.name] = userProfile.address.state;
            } else if (fieldNameLower.includes('zip') || fieldNameLower.includes('postal')) {
              initialValues[field.name] = userProfile.address.zipCode;
            } else if (fieldNameLower.includes('country')) {
              initialValues[field.name] = userProfile.address.country;
            } else {
              initialValues[field.name] = `${userProfile.address.street}, ${userProfile.address.city}, ${userProfile.address.state} ${userProfile.address.zipCode}`;
            }
          } else {
            initialValues[field.name] = field.suggestedValue || '';
          }
        } else {
          initialValues[field.name] = field.suggestedValue || '';
        }
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

    // Convert signatures to values and prepare checkbox values
    const formValues = { ...values };
    fields.forEach(field => {
      if (field.isSignature && signatureRefs.current[field.name]) {
        const signatureCanvas = signatureRefs.current[field.name];
        if (!signatureCanvas.isEmpty()) {
          formValues[field.name] = signatureCanvas.toDataURL('image/png', {
            includeBackgroundColor: false,
          });
        }
      }
    });

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

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading ...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <div key={field.name} className="space-y-2" id={field.name}>
                  {field.isCheckbox ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        isSelected={values[field.name] || false}
                        onValueChange={(checked) =>
                          setValues({
                            ...values,
                            [field.name]: checked
                          })
                        }
                      />
                      <label
                        htmlFor={field.name}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {field.label || field.name}
                      </label>
                    </div>
                  ) : field.isSignature ? (
                    <div className="border rounded p-2 bg-white">
                      <label className="block text-sm font-medium mb-2">
                        {field.name} {field.required && '*'}
                      </label>
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
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
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
                    <div>
                      <label className="block text-sm font-medium">
                        {field.name} {field.required && '*'}
                      </label>
                      <Input
                        value={values[field.name] || ''}
                        onChange={(e) =>
                          setValues({ ...values, [field.name]: e.target.value })
                        }
                        placeholder={field.suggestedValue || `Enter ${field.name}`}
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button onClick={handleFillForm} className="mt-4">
                Fill and Download PDF
              </Button>
            </div>
          )}
        </Card>

        {file && (
          <PDFPreview
            file={file}
            fields={fields}
            onFieldClick={(field) => {
              const element = document.getElementById(field.name);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                const input = element.querySelector('input');
                if (input) input.focus();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}