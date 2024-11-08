// app/api/fill-form/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { dataURLtoUint8Array } from '@/app/utils/pdfUtils';

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
          const signatureBytes = dataURLtoUint8Array(value);
          const signatureImage = await pdfDoc.embedPng(signatureBytes);
          const widgets = field.acroField.getWidgets();
          
          for (const widget of widgets) {
            const pageRef = widget.P();
            let pageNum = pages.findIndex(page => page.ref === pageRef);
            if (pageNum === -1) continue;

            const page = pages[pageNum];
            const { x, y, width, height } = widget.getRectangle();
            const signatureAspectRatio = signatureImage.width / signatureImage.height;
            let signatureWidth = width;
            let signatureHeight = height;

            if (width / height > signatureAspectRatio) {
              signatureWidth = height * signatureAspectRatio;
            } else {
              signatureHeight = width / signatureAspectRatio;
            }

            const xOffset = (width - signatureWidth) / 2;
            const yOffset = (height - signatureHeight) / 2;

            page.drawImage(signatureImage, {
              x: x + xOffset,
              y: y + yOffset,
              width: signatureWidth,
              height: signatureHeight
            });
          }
          form.removeField(field);
        } else if (field.constructor.name === 'PDFCheckBox') {
          // Handle checkbox field
          const checkbox = form.getCheckBox(fieldName);
          if (value === true) {
            checkbox.check();
          } else {
            checkbox.uncheck();
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
    // form.flatten();

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