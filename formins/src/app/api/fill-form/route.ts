import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';

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

    // Debug: log all available fields
    console.log('Available fields:', form.getFields().map(f => f.getName()));
    console.log('Values to fill:', values);

    // Fill each field
    for (const [fieldName, value] of Object.entries(values)) {
      try {
        if (value === null || value === undefined || value === '') continue;

        const field = form.getField(fieldName);
        if (!field) {
          console.warn(`Field not found: ${fieldName}`);
          continue;
        }

        if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
          // Handle signature
          const base64Data = value.split(',')[1];
          const signatureBytes = Buffer.from(base64Data, 'base64');
          const signatureImage = await pdfDoc.embedPng(signatureBytes);

          const signatureField = field;
          const widgets = signatureField.acroField.getWidgets();

          for (const widget of widgets) {
            const { x, y, width, height } = widget.getRectangle();
            const page = pdfDoc.getPages()[0]; // Assuming first page

            // Draw signature
            page.drawImage(signatureImage, {
              x,
              y,
              width,
              height,
              opacity: 0.9
            });
          }

          // Remove the original field
          form.removeField(field);
        } else if (typeof value === 'boolean') {
          // Handle checkbox
          const checkbox = form.getCheckBox(fieldName);
          value ? checkbox.check() : checkbox.uncheck();
        } else {
          // Handle text field
          const textField = form.getTextField(fieldName);
          textField.setText(value.toString());
        }
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
      }
    }

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