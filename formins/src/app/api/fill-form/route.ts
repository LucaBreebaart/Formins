// app/api/fill-form/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const valuesJson = formData.get('values') as string;

    // Debug log
    console.log('Received values:', valuesJson);

    if (!pdfFile || !valuesJson) {
      return NextResponse.json({
        error: 'Missing required data',
        details: {
          hasPdf: !!pdfFile,
          hasValues: !!valuesJson
        }
      }, { status: 400 });
    }

    const values = JSON.parse(valuesJson) as Record<string, string>;

    // Debug log
    console.log('Parsed values:', values);

    // Load the PDF document
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Get all available fields for debugging
    const availableFields = form.getFields();
    console.log('Available PDF fields:', availableFields.map(f => ({
      name: f.getName(),
      type: f.constructor.name
    })));

    // Fill each field with its corresponding value
    for (const [fieldName, value] of Object.entries(values)) {
      try {
        // First try to get the field to see if it exists
        const fields = form.getFields();
        const field = fields.find(f => f.getName() === fieldName);

        if (field) {
          if (field.constructor.name === 'PDFTextField') {
            const textField = form.getTextField(fieldName);
            await textField.setText(value);
          } else {
            console.log(`Field ${fieldName} is not a text field:`, field.constructor.name);
          }
        } else {
          console.log(`Field not found: ${fieldName}`);
        }
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
      }
    }

    const filledPdfBytes = await pdfDoc.save();

    // Return the filled PDF
    return new Response(filledPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
      },
    });

  } catch (error) {
    // Detailed error logging
    console.error('Error in fill-form:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });

    return NextResponse.json({
      error: 'Failed to fill form',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}