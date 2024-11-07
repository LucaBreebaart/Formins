// app/api/fill-form/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { dataURLtoUint8Array, pixelsToPDFPoints } from '@/app/utils/pdfUtils';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const valuesJson = formData.get('values') as string;
    
    if (!pdfFile || !valuesJson) {
      return NextResponse.json({
        error: 'Missing required data'
      }, { status: 400 });
    }

    console.log('Received values:', valuesJson); // Debug log

    const values = JSON.parse(valuesJson);
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    
    // Fill each field
    for (const [fieldName, value] of Object.entries(values)) {
      try {
        const field = form.getField(fieldName);
        
        if (!field) {
          console.warn(`Field not found: ${fieldName}`);
          continue;
        }

        if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
          // Handle signature field
          try {
            const signatureBytes = dataURLtoUint8Array(value);
            const signatureImage = await pdfDoc.embedPng(signatureBytes);

            // Get field position from widget annotations
            const widgets = field.acroField.getWidgets();
            if (widgets.length === 0) {
              throw new Error('No widget annotations found for signature field');
            }

            // Process each widget (there might be multiple instances of the same field)
            for (const widget of widgets) {
              // Get the page number for this widget
              const pageRef = widget.P();
              let pageNum = 0;

              // Find the correct page number by comparing references
              for (let i = 0; i < pages.length; i++) {
                if (pages[i].ref === pageRef) {
                  pageNum = i;
                  break;
                }
              }

              const page = pages[pageNum];
              const { x, y, width, height } = widget.getRectangle();

              // Calculate signature dimensions while maintaining aspect ratio
              const signatureAspectRatio = signatureImage.width / signatureImage.height;
              let signatureWidth = width;
              let signatureHeight = height;

              if (width / height > signatureAspectRatio) {
                signatureWidth = height * signatureAspectRatio;
              } else {
                signatureHeight = width / signatureAspectRatio;
              }

              // Center the signature in the field
              const xOffset = (width - signatureWidth) / 2;
              const yOffset = (height - signatureHeight) / 2;

              console.log(`Drawing signature for field ${fieldName} on page ${pageNum + 1}`, {
                x: x + xOffset,
                y: y + yOffset,
                width: signatureWidth,
                height: signatureHeight,
              });

              // Draw the signature
              page.drawImage(signatureImage, {
                x: x + xOffset,
                y: y + yOffset,
                width: signatureWidth,
                height: signatureHeight
              });
            }

            // Remove the original form field
            form.removeField(field);
          } catch (signatureError) {
            console.error('Error processing signature for field:', fieldName, signatureError);
          }
        } else if (field.constructor.name === 'PDFTextField') {
          // Handle regular text field
          const textField = form.getTextField(fieldName);
          await textField.setText(value as string);
        }
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
      }
    }

    // Flatten form fields to prevent further editing
    form.flatten();

    const filledPdfBytes = await pdfDoc.save({
      updateFieldAppearances: true
    });

    return new Response(filledPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
      },
    });

  } catch (error) {
    console.error('Error in fill-form:', error);
    return NextResponse.json({
      error: 'Failed to fill form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}