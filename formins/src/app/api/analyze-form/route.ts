// Improved version of app/api/analyze-form/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

interface FormField {
  name: string;          // The field name
  type: string;          // Type of field (text, checkbox, etc)
  page: number;          // Page number
  required: boolean;     // If the field appears to be required
  suggestedValue?: string; // AI-detected suggested value
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    // 1. get the actual fillable fields from the PDF
    const pdfDoc = await PDFDocument.load(buffer);
    const form = pdfDoc.getForm();
    const pdfFields = form.getFields().map(field => ({
      name: field.getName(),
      type: field.constructor.name,
      isRequired: false, // Update this based on AI analysis
    }));

    // 2. Use Document AI to analyze the form structure
    const client = new DocumentProcessorServiceClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    const [result] = await client.processDocument({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us/processors/${process.env.GOOGLE_CLOUD_FORM_PARSER_PROCESSOR_ID}`,
      rawDocument: {
        content: Buffer.from(buffer),
        mimeType: 'application/pdf',
      },
    });

    // 3. Combine PDF field info with AI analysis
    const formFields: FormField[] = pdfFields.map(pdfField => {
      // Find corresponding AI-detected field
      const aiField = result.document?.pages?.flatMap(page => 
        page.formFields?.filter(field => 
          field.fieldName?.textAnchor?.content?.toLowerCase().includes(pdfField.name.toLowerCase())
        ) || []
      )[0];

      return {
        name: pdfField.name,
        type: pdfField.type,
        page: 1, 
        required: false, 
        suggestedValue: aiField?.fieldValue?.textAnchor?.content || ''
      };
    });

    return NextResponse.json({ 
      formFields,
      pageCount: pdfDoc.getPageCount()
    });

  } catch (error) {
    console.error('Error analyzing form:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}