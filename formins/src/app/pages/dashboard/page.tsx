// app/dashboard/page.tsx
import FormTemplate from "@/app/components/FormTemplate";
import PDFUploadComponent from "@/app/components/PDFUpload";

export default function Dashboard() {
  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">PDF Form Filler</h1>
        <p className="mb-6 text-gray-600">
          Upload a PDF form to automatically detect fields and fill them out.
        </p>
        <FormTemplate />
        {/* <PDFUploadComponent /> */}
      </div>
    </main>
  );
}