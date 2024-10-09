import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize the client
const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function POST(request: Request) {
  const { pdfUrl } = await request.json();

  if (!pdfUrl) {
    return NextResponse.json({ message: 'PDF URL is required' }, { status: 400 });
  }

  try {
    const [result] = await vision.documentTextDetection(pdfUrl);
    const fullTextAnnotation = result.fullTextAnnotation;

    if (fullTextAnnotation) {
      return NextResponse.json({
        text: fullTextAnnotation.text || '',
        // Extract more data as needed
      });
    } else {
      return NextResponse.json({ message: 'No text found in the PDF' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ message: 'Error processing PDF' }, { status: 500 });
  }
}