// app/api/process-pdf/route.ts
import { NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

const client = new DocumentProcessorServiceClient({
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us/processors/${process.env.GOOGLE_CLOUD_FORM_PARSER_PROCESSOR_ID}`;
    const buffer = await file.arrayBuffer();

    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: Buffer.from(buffer),
        mimeType: 'application/pdf',
      },
    });

    if (!result.document) {
      throw new Error('No document in response');
    }

    const formFields = result.document.pages?.flatMap((page) => {
      return page.formFields?.map((field) => ({
        fieldName: field.fieldName?.textAnchor?.content || 'Unknown',
        fieldValue: field.fieldValue?.textAnchor?.content || '',
      })) || [];
    }) || [];

    return NextResponse.json({ formFields });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}