import React from 'react';

import FileUploadButton from '@/app/components/fileUploadButton/fileUploiadButton';


export default function Dashboard() {
  return (

    <main className="relative p-11 h-full">
      <div className="container mx-auto relative">

        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Welcome to your dashboard. Add your widgets and data visualizations here.</p>
        <FileUploadButton
          size='lg'
          accept='image/*'
          // startContent={<PiUploadSimpleBold />}
          // rejectProps={{ color: 'danger', startContent: <PiXCircleBold /> }}
          // onUpload={files => {
          //   console.log(files[0]);
          // }}
        >
          Upload
        </FileUploadButton>
      </div>
    </main>
  );
}