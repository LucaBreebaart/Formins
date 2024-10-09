import React, { useState } from 'react';
import { Button, Input } from '@nextui-org/react';
import { storage } from '../firebase'; // Make sure this path is correct
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProcessedData {
  text: string;
  // Add more fields as needed based on the information you want to extract
}

const PDFUploadComponent: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const uploadAndProcessPDF = async () => {
    if (!file) return;

    setProcessing(true);

    try {
      // Upload PDF to Firebase Storage
      const storageRef = ref(storage, 'pdfs/' + file.name);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Send the download URL to our API route for processing
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl: downloadURL }),
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const result = await response.json();
      setProcessedData(result);
    } catch (error) {
      console.error('Error processing PDF:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="w-full"
      />
      <Button
        color="primary"
        onClick={uploadAndProcessPDF}
        disabled={!file || processing}
      >
        {processing ? 'Processing...' : 'Upload and Process PDF'}
      </Button>
      {processedData && (
        <div>
          <h2 className="text-xl font-semibold">Extracted Text:</h2>
          <p>{processedData.text}</p>
          {/* Display more extracted data here */}
        </div>
      )}
    </div>
  );
};

export default PDFUploadComponent;