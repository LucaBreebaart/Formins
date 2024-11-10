import { NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { PDFDocument, rgb } from 'pdf-lib';

// Document AI Types
interface DocAITextAnchor {
  textSegments: Array<{
    startIndex: string;
    endIndex: string;
  }>;
}

interface DocAILayout {
  textAnchor: DocAITextAnchor;
  boundingPoly: {
    vertices: Array<{
      x?: number;
      y?: number;
    }>;
    normalizedVertices: Array<{
      x: number;
      y: number;
    }>;
  };
  orientation?: string;
  confidence?: number;
}

interface DocAIPage {
  pageNumber: number;
  dimension: {
    width: number;
    height: number;
  };
  layout: DocAILayout;
  paragraphs: Array<{
    layout: DocAILayout;
  }>;
}

interface DocAIDocument {
  text: string;
  pages: DocAIPage[];
  mimeType: string;
}

interface FormField {
  name: string;
  type: string;
  page: number;
  required: boolean;
  isCheckbox?: boolean;
  isSignature?: boolean;
  suggestedValue?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Helper functions
function getTextFromSegments(text: string, segments: Array<{ startIndex: string; endIndex: string }>) {
  return segments.map(segment => {
    return text.substring(parseInt(segment.startIndex), parseInt(segment.endIndex));
  }).join('');
}

function normalizeFieldName(name: string): string {
  return name.trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

function getFieldType(fieldName: string): string {
  const name = fieldName.toLowerCase();
  if (name.includes('email')) return 'email';
  if (name.includes('phone') || name.includes('contact')) return 'tel';
  if (name.includes('date')) return 'date';
  if (name.includes('signature')) return 'signature';
  return 'text';
}

function calculatePDFCoordinates(
  vertices: Array<{ x: number; y: number }>,
  pageWidth: number,
  pageHeight: number,
  text: string
) {
  // Find position of the colon
  const colonIndex = text.indexOf(':');
  const textBeforeColon = text.substring(0, colonIndex + 1);

  const averageCharWidth = 6.5;
  const estimatedColonPosition = textBeforeColon.length * averageCharWidth;

  // Calculate coordinates
  const x = vertices[0].x * pageWidth;
  const y = pageHeight - (vertices[0].y * pageHeight);
  const width = (vertices[1].x - vertices[0].x) * pageWidth;
  const height = (vertices[2].y - vertices[0].y) * pageHeight;

  return {
    x: x + estimatedColonPosition + 5,
    y: y - height - 5,
    width: Math.max(width * 1.5, 200),
    height: Math.max(height, 20)
  };
}


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      throw new Error('No file uploaded');
    }

    const buffer = await file.arrayBuffer();

    // Load PDF and create form fields
    const pdfDoc = await PDFDocument.load(buffer);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Process with Document AI
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

    const document = result.document as unknown as DocAIDocument;
    const formFields: FormField[] = [];

    if (!document || !document.text) {
      throw new Error('Invalid document structure from Document AI');
    }

    // Clear existing form fields
    // const existingFields = form.getFields();
    // existingFields.forEach(field => {
    //   form.removeField(field);
    // });

    // Process fields from Document AI layout and create PDF form fields
    document.pages[0].paragraphs.forEach((paragraph) => {
      const content = getTextFromSegments(document.text, paragraph.layout.textAnchor.textSegments);
      if (content.includes(':') && !content.includes('TEL:') && !content.includes('FAX:')) {
        // First, split and normalize field name
        const [fieldName, suggestedValue] = content.split(':').map(s => s.trim());
        const normalizedFieldName = normalizeFieldName(fieldName);
        const vertices = paragraph.layout.boundingPoly.normalizedVertices;

        // Then check if field exists
        if (!formFields.find(f => f.name === normalizedFieldName)) {
          const isCheckbox = content.toLowerCase().includes('confirm') ||
            content.toLowerCase().includes('agree') ||
            content.toLowerCase().includes('yes') ||
            content.toLowerCase().includes('no');

          // Calculate proper PDF coordinates with content awareness
          const bounds = calculatePDFCoordinates(
            vertices,
            width,
            height,
            content
          );

          // Adjust bounds based on field type
          if (isCheckbox) {
            bounds.width = 15;
            bounds.height = 15;
            bounds.x += 30;
          } else if (fieldName.toLowerCase().includes('signature')) {
            bounds.height = 50;
            bounds.width = Math.min(bounds.width, 300);
          } else {
            if (fieldName.toLowerCase().includes('email')) {
              bounds.width = Math.min(bounds.width, 250);
            } else if (fieldName.toLowerCase().includes('phone')) {
              bounds.width = Math.min(bounds.width, 150);
            } else if (fieldName.toLowerCase().includes('name')) {
              bounds.width = Math.min(bounds.width, 200);
            }
          }

          try {
            // Create field with calculated bounds
            if (isCheckbox) {
              const checkbox = form.createCheckBox(normalizedFieldName);
              checkbox.addToPage(firstPage, {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                borderColor: rgb(0.7, 0.7, 0.7),
                borderWidth: 1,
              });
            } else if (fieldName.toLowerCase().includes('signature')) {
              const signatureField = form.createTextField(normalizedFieldName);
              signatureField.addToPage(firstPage, {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                borderColor: rgb(0.7, 0.7, 0.7),
                borderWidth: 1,
              });
              signatureField.setFontSize(0);
            } else {
              const textField = form.createTextField(normalizedFieldName);
              textField.addToPage(firstPage, {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                borderColor: rgb(0.7, 0.7, 0.7),
                borderWidth: 1,
              });
              textField.setFontSize(11);
            }

            formFields.push({
              name: normalizedFieldName,
              type: getFieldType(fieldName),
              page: 0,
              required: content.includes('*'),
              isCheckbox,
              isSignature: fieldName.toLowerCase().includes('signature'),
              suggestedValue,
              bounds: {
                x: bounds.x / width,
                y: bounds.y / height,
                width: bounds.width / width,
                height: bounds.height / height
              }
            });
          } catch (error) {
            console.error(`Error creating field ${normalizedFieldName}:`, error);
          }
        }
      }
    });


    // Save the modified PDF with form fields
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedPdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

    const fieldsList = form.getFields().map(field => ({
      name: field.getName(),
      type: field.constructor.name
    }));

    return NextResponse.json({
      formFields,
      modifiedPdf: Buffer.from(await pdfDoc.save()).toString('base64'),
      pageCount: document.pages?.length || 1,
      debug: {
        fieldCount: formFields.length,
        documentText: document.text,
        createdFields: fieldsList
      }
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze form',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }

}