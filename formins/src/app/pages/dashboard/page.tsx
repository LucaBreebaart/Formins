import React from 'react';
import PDFUploadComponent from '@/app/components/PDFUpload';

const Dashboard: React.FC = () => {
  return (
    <main className="relative p-11 h-full">
      <div className="container mx-auto relative">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="mb-6">Welcome to your dashboard. Upload a PDF to process it with AI.</p>
        
        <PDFUploadComponent />
      </div>
    </main>
  );
};

export default Dashboard;