import React, { useState, useCallback } from 'react';
import { Button } from '@nextui-org/react';
import { storage } from '../firebase'; // Make sure this path is correct
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useDropzone } from 'react-dropzone';

interface ProcessedData {
  text: string;
  // Add more fields as needed based on the information you want to extract
}

const PDFUploadComponent: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

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
      <div
        {...getRootProps()}
        className={`w-full p-6 mt-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-sm text-blue-500 ">File selected: {file.name}</p>
        ) : isDragActive ? (
          <p className="text-sm text-blue-500">Drop the PDF here ...</p>
        ) : (
          <p className="text-sm text-gray-500">
            Drag and drop a PDF here, or click to select a file
          </p>
        )}
      </div>
      <Button
        color="secondary"
        onClick={uploadAndProcessPDF}
        disabled={!file || processing}
        className="w-full"
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