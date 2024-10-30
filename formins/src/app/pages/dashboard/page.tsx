// app/dashboard/page.tsx
import PDFUploadComponent from '@/app/components/PDFUpload';

export default function Dashboard() {
  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">PDF Form Processing</h1>
        <p className="mb-6 text-gray-600">
          Upload a PDF form to automatically extract its fields.
        </p>
        <PDFUploadComponent />
      </div>
    </main>
  );
}