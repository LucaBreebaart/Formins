import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

interface FormField {
  name: string;          // The field name
  type: string;          // Type of field (text, checkbox, etc)
  page: number;          // Page number
  required: boolean;     // If the field appears to be required
  suggestedValue?: string; // AI-detected suggested value
  bounds?: {             // Position information
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
    const allPages = pdfDoc.getPages();
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
    
    // 3. Combine PDF field info with AI analysis and get field positions
    const formFields: FormField[] = pdfFields.map(pdfField => {
      // Find corresponding AI-detected field
      const aiField = result.document?.pages?.flatMap(page =>
        page.formFields?.filter(field =>
          field.fieldName?.textAnchor?.content?.toLowerCase().includes(pdfField.name.toLowerCase())
        ) || []
      )[0];

      // Get field position information
      const field = form.getField(pdfField.name);
      const widgets = field.acroField.getWidgets();
      const widget = widgets[0];  // Get first widget (most forms have one widget per field)
      const bounds = widget ? widget.getRectangle() : undefined;
      const pageIndex = widget ? allPages.findIndex(page => page.ref === widget.P()) : 0;

      return {
        name: pdfField.name,
        type: pdfField.type,
        page: pageIndex + 1,
        required: false, // Could be determined from AI analysis
        suggestedValue: aiField?.fieldValue?.textAnchor?.content || '',
        bounds: bounds ? {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        } : undefined
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