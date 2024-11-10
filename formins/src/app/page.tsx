"use client"

import FormTemplate from "./components/FormTemplate";
import StyledNavBar from "./components/ui/Navbar";
import React from 'react';

export default function Home() {
  return (
    <main className='relative min-h-dvh h-full bg-gray-1 text-foreground'>
      <StyledNavBar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">PDF Form Filler</h1>
        <p className="mb-6 text-gray-600">
          Upload a PDF form to automatically detect fields and fill them out.
        </p>
        <FormTemplate />
      </div>
    </main>
  );
}