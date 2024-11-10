"use client"

import React from 'react';
import FormTemplate from "./components/FormTemplate";
import StyledNavBar from "./components/ui/Navbar";
import { BackgroundLines } from "@/components/ui/background-lines";
import { BackgroundBeams } from '@/components/ui/background-beams';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';

export default function Home() {
  return (
    <main className='relative min-h-dvh h-full bg-background'>
      <StyledNavBar />
      <div className="relative inset-0 mt-10">

        <div className="relative z-10 px-4 pt-8 pb-16 sm:pt-12 lg:pt-16">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold text-foreground mb-2 tracking-tight font-secondary">
                PDF Form <span className="text-green-1">Filler</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-secondary">
                Upload a PDF form to automatically detect fields and fill them out with our intelligent form processing system.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  title: "Auto Detection",
                  description: "Intelligent field detection and recognition"
                },
                {
                  title: "Quick Fill",
                  description: "Automatically populate form fields instantly"
                },
                {
                  title: "Easy Export",
                  description: "Download your completed PDF in one click"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-1/80 backdrop-blur-sm p-6 rounded-xl border border-gray-3/50 hover:border-green-1/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Main Form Section */}
            <div className="backdrop-blur-sm rounded-xl border border-gray-3/50 p-6 md:p-8 bg-background">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Upload Your Form</h2>
                  <p className="text-gray-400">Supported formats: PDF</p>
                </div>
                {/* Optional: Add any action buttons or indicators here */}
              </div>

              <FormTemplate />
            </div>
          </div>
        </div>
      </div>
      {/* <BackgroundBeams className='' /> */}
      {/* <BackgroundBeamsWithCollision className='absolute min-w-lvh min-h-lvh top-0'>
        <div className='w-full h-full'>

        </div>
      </BackgroundBeamsWithCollision> */}
    </main>
  );
}