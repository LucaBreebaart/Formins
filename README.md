<br />

![GitHub repo size](https://img.shields.io/github/repo-size/LucaBreebaart/formins?color=%23000000)
![GitHub watchers](https://img.shields.io/github/watchers/LucaBreebaart/formins?color=%23000000)
![GitHub language count](https://img.shields.io/github/languages/count/LucaBreebaart/formins?color=%23000000)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/LucaBreebaart/formins?color=%23000000)

<!-- HEADER SECTION -->
<h6 align="center">Luca Breebaart - PDF Form Automation</h6>
<p align="center">
</br>

<p align="center">
  <a href="https://github.com/LucaBreebaart/formins">
    <img src="readmeAssets/logo.SVG" alt="Logo" width="140" height="140">
  </a>
  
  <h3 align="center">FORMINS</h3>

  <p align="center">
    Intelligent PDF Form Processing Made Simple<br>
    <a href="https://github.com/LucaBreebaart/formins"><strong>Explore the docs »</strong></a>
   <br />
   <br />
   <a href="your-demo-link">View Demo</a>
    ·
    <a href="your-issues-link">Report Bug</a>
    ·
    <a href="your-issues-link">Request Feature</a>
</p>

## Table of Contents

- [About the Project](#about-the-project)
  - [Project Description](#project-description)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [How to install](#how-to-install)
- [Features and Functionality](#features-and-functionality)
- [Development Process](#development-process)
  - [Implementation Process](#implementation-process)
  - [Future Implementation](#future-implementation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About the Project



### Project Description

FORMINS is a web application that automates the process of filling out PDF forms. By leveraging Google Document AI, it analyses uploaded PDF forms, detects input fields, and creates a fillable form template. Users can then easily fill out the form fields, including text inputs, checkboxes, and signatures. The application also supports auto-filling based on user profile information. Once completed, users can download the filled PDF form. This project aims to streamline the form-filling process and enhance productivity.

### Built With
* [Next.js 14](https://nextjs.org/)
* [React](https://reactjs.org/)
* [Google Document AI](https://cloud.google.com/document-ai)
* [Firebase Authentication](https://firebase.google.com/)
* [pdf-lib](https://pdf-lib.js.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [NextUI](https://nextui.org/)

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Platform account
- Firebase project
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/LucaBreebaart/formins.git
cd formins
```

2. Install dependencies
```bash
npm install
```

3. Configure Google Cloud Platform
```bash
# Visit Google Cloud Console
# Create new project or select existing
# Enable Document AI API
# Create Form Parser processor
# Download service account key
```

4. Set up Firebase
```bash
# Create Firebase project
# Enable Authentication
# Create web app
# Copy config details
```

5. Configure environment variables
Create `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

GOOGLE_CLOUD_CLIENT_EMAIL=your-client-email
GOOGLE_CLOUD_PRIVATE_KEY=your-private-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_FORM_PARSER_PROCESSOR_ID=your-processor-id
```

6. Run development server
```bash
npm run dev
```

## Features and Functionality

### Step 1: PDF Upload

The user uploads a PDF form through the application's user interface. The PDF file is sent to the server for further processing.

```jsx
<input
 type="file"
 onChange={handleFileChange}
 accept=".pdf"
/>
```

### Step 2: PDF Analysis with AI

The server receives the uploaded PDF and uses Google Document AI to analyse the document and detect form fields.

```typescript
// API route handler for form analysis
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('pdf') as File;

  const pdfBuffer = await file.arrayBuffer();

  // Process the PDF with Document AI
  const [result] = await client.processDocument({
    name: `projects/${projectId}/locations/us/processors/${processorId}`,
    rawDocument: {
      content: Buffer.from(pdfBuffer),
      mimeType: 'application/pdf',
    },
  });

  // Extract form fields from the analysis result
  const formFields: FormField[] = [];
  result.document.pages.forEach((page) => {
    page.formFields.forEach((field) => {
      formFields.push({
        name: field.fieldName,
        type: field.fieldType,
        page: page.pageNumber,
        bounds: field.boundingPoly.normalizedVertices,
      });
    });
  });

  // Return the extracted form fields
  return NextResponse.json({ formFields });
}
```

### Step 3: Form Field Creation

Based on the detected form fields from the AI analysis, the application creates a fillable form template. Each form field is represented by a corresponding input element in the user interface.

```typescript
{fields.map((field) => (
  <div key={field.name}>
    {field.type === 'text' && (
      <Input
        label={field.name}
        value={values[field.name] || ''}
        onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
      />
    )}
    {field.type === 'checkbox' && (
      <Checkbox
        label={field.name}
        checked={values[field.name] || false}
        onChange={(checked) => setValues({ ...values, [field.name]: checked })}
      />
    )}
    {field.type === 'signature' && (
      <SignaturePad
        ref={(ref) => (signatureRefs.current[field.name] = ref)}
        options={{ penColor: 'blue' }}
      />
    )}
  </div>
))}
```

### Step 4: Auto-Fill with User Profile

If the user is logged in, the application automatically fills form fields based on their profile information.

```typescript
const processFieldsWithAutofill = (fields: FormField[], userProfile: UserProfile | null) => {
  const initialValues: Record<string, any> = {};

  fields.forEach((field) => {
    const fieldNameLower = field.name.toLowerCase();

    if (userProfile) {
      if (fieldNameLower.includes('email')) {
        initialValues[field.name] = userProfile.email;
      } else if (fieldNameLower.includes('name')) {
        initialValues[field.name] = `${userProfile.firstName} ${userProfile.lastName}`;
      } else if (fieldNameLower.includes('address')) {
        initialValues[field.name] = userProfile.address.street;
      }
      // Additional field mappings...
    }

    if (!initialValues[field.name]) {
      initialValues[field.name] = field.suggestedValue || '';
    }
  });

  return initialValues;
};
```

### Step 5: Form Filling and Signature Capture

The user fills out the form fields and provides their signature using the signature pad component. The signature is captured as an image.

```
<Button onClick={handleFillForm}>Fill and Download PDF</Button>
```

### Step 6: PDF Generation

Upon form submission, the server generates a filled PDF document using the user-provided form data and the captured signature images.

```typescript
// API route handler for form filling
export async function POST(request: Request) {
  const formData = await request.formData();
  const pdfFile = formData.get('pdf') as File;
  const formValues = JSON.parse(formData.get('values') as string);

  const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());

  // Fill form fields with user-provided values
  const form = pdfDoc.getForm();
  Object.entries(formValues).forEach(([fieldName, fieldValue]) => {
    const field = form.getField(fieldName);
    if (field instanceof PDFTextField) {
      field.setText(fieldValue);
    } else if (field instanceof PDFCheckBox) {
      field.check();
    } else if (field instanceof PDFSignature) {
      const signatureImage = await pdfDoc.embedPng(fieldValue);
      field.setImage(signatureImage);
    }
  });

  // Save the filled PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Return the filled PDF
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="filled-form.pdf"',
    },
  });
}
```

### Step 7: PDF Download

The filled PDF is sent back to the client, and the user can download the completed form.

```typescript
const response = await fetch('/api/fill-form', {
  method: 'POST',
  body: formData,
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);

// Trigger download of the filled PDF
const a = document.createElement('a');
a.href = url;
a.download = 'filled-form.pdf';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

## Development Process

### Implementation Process
* Integrated Google Document AI for form analysis
* Built dynamic form field detection system
* Created interactive PDF preview with field highlighting
* Implemented signature capture and embedding
* Developed user profile-based auto-fill
* Added authentication and user management

### Future Implementation
* Fully funtional on all input fields
* Optimised user data placement
* Cloud storage integration
* Advanced field validation
* Mobile optimisation(Edit on the actual PDF)


## Contributing

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit Changes (`git commit -m 'Add NewFeature'`)
4. Push to Branch (`git push origin feature/NewFeature`)
5. Open Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Luca Breebaart - [luca.breebaart99@gmail.com](mailto:luca.breebaart99@gmail.com)
Project Link: [https://github.com/LucaBreebaart/formins](https://github.com/LucaBreebaart/formins)