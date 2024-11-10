import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Checkbox } from '@nextui-org/react';
import SignaturePad from 'react-signature-canvas';
import PDFPreview from './PDFPreview';
import { FormField, SignatureCanvas } from '../types/form';
import { auth } from "@/app/firebase";
import { getUserProfile } from '../services/profileService';
import { UserProfile } from '../types/user';
import { FileUpload } from '@/components/ui/file-upload';

export default function FormTemplate() {
  const [modifiedPdfBase64, setModifiedPdfBase64] = useState<string | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const signatureRefs = useRef<{ [key: string]: SignatureCanvas }>({});

  const [file, setFile] = useState<File | null>(null);

  const loadUserProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const processFieldsWithAutofill = (fields: FormField[], userProfile: UserProfile | null) => {
    const initialValues: Record<string, any> = {};

    fields.forEach((field: FormField) => {
      const fieldNameLower = field.name.toLowerCase();

      if (field.isCheckbox) {
        initialValues[field.name] = false;
      } else if (field.isSignature) {
        initialValues[field.name] = '';
      } else if (userProfile) {
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
        }
      }

      if (!initialValues[field.name]) {
        initialValues[field.name] = field.suggestedValue || '';
      }
    });

    return initialValues;
  };

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

      // Store the modified PDF
      setModifiedPdfBase64(data.modifiedPdf);
      setFields(data.formFields);
      setFile(file);

      const initialValues = processFieldsWithAutofill(data.formFields, userProfile);
      setValues(initialValues);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = async () => {
    if (!modifiedPdfBase64) return;

    setLoading(true);
    try {
      // Convert base64 back to File
      const pdfBlob = await fetch(`data:application/pdf;base64,${modifiedPdfBase64}`).then(res => res.blob());
      const modifiedPdfFile = new File([pdfBlob], 'form-with-fields.pdf', { type: 'application/pdf' });

      // Collect form values including signatures
      const formValues = { ...values };
      fields.forEach(field => {
        if (field.isSignature && signatureRefs.current[field.name]) {
          const signatureCanvas = signatureRefs.current[field.name];
          if (!signatureCanvas.isEmpty()) {
            formValues[field.name] = signatureCanvas.toDataURL('image/png');
          }
        }
      });

      // Create form data with modified PDF
      const formData = new FormData();
      formData.append('pdf', modifiedPdfFile);
      formData.append('values', JSON.stringify(formValues));

      console.log('Sending values:', formValues);

      const response = await fetch('/api/fill-form', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fill form');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error filling form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const uploadedFile = files[0]; // Take the first file
    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', uploadedFile);

    try {
      const response = await fetch('/api/analyze-form', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setModifiedPdfBase64(data.modifiedPdf);
      setFields(data.formFields);
      setFile(uploadedFile);

      const initialValues = processFieldsWithAutofill(data.formFields, userProfile);
      setValues(initialValues);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 bg-background">
          <div className="w-full h-[auto] border-2 border-dashed border-gray-3/50 rounded-xl transition-all duration-300 bg-background mb-4">
            <FileUpload
              onChange={handleFileUpload}
            />
          </div>

          {!auth.currentUser && fields.length > 0 && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
              Sign in to enable auto-fill features with your profile information
            </div>
          )}

          {loading && <p className='mt-2' >Analyzing form...</p>}

          {fields.length > 0 && (
            <div className="space-y-6">
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
                        classNames={{
                          label: "text-foreground",
                          wrapper: "bg-gray-2/50 hover:bg-gray-2/70"
                        }}
                      />
                      <label
                        htmlFor={field.name}
                        className="text-sm text-gray-400"
                      >
                        {field.label || field.name}
                      </label>
                    </div>
                  ) : field.isSignature ? (
                    <div className="bg-gray-1/80 backdrop-blur-sm rounded-xl border border-gray-3/50 p-4">
                      <label className="block text-sm text-gray-400 mb-2">
                        {field.name} {field.required && '*'}
                      </label>
                      <SignaturePad
                        ref={(ref) => {
                          if (ref) {
                            signatureRefs.current[field.name] = ref;
                          }
                        }}
                        canvasProps={{
                          className: 'signature-canvas rounded-lg',
                          width: 500,
                          height: 200,
                          style: {
                            width: '100%',
                            height: '200px',
                            maxWidth: '500px',
                            backgroundColor: '#fff',
                            border: '1px solid rgba(59, 59, 59, 0.5)',
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => signatureRefs.current[field.name]?.clear()}
                        className="mt-2 bg-gray-2/50 text-foreground hover:bg-gray-2/70"
                      >
                        Clear Signature
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Input
                        label={`${field.name}${field.required ? ' *' : ''}`}
                        value={values[field.name] || ''}
                        onChange={(e) =>
                          setValues({ ...values, [field.name]: e.target.value })
                        }
                        placeholder={field.suggestedValue || `Enter ${field.name}`}
                        variant="bordered"
                        classNames={{
                          input: "bg-transparent",
                          inputWrapper: "bg-gray-2/50 border-gray-3/50 hover:border-green-1",
                          label: "text-gray-400"
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button
                onClick={handleFillForm}
                className="w-full bg-secondary text-white font-semibold transition-colors mt-6"
              >
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