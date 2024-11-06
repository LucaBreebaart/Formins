export interface FormTemplate {
    id: string;
    name: string;
    fields: FormField[];
  }
  
  export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    required: boolean;
    options?: string[]; // For select fields
  }
  
  export interface ExtractedField {
    fieldName: string;
    fieldValue: string;
  }