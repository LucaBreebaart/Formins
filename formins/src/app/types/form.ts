export interface FormField {
  name: string;
  type: string;
  page: number;
  required: boolean;
  suggestedValue?: string;
  isSignature?: boolean;
  isCheckbox?: boolean;
  label?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type SignatureCanvas = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, options?: any) => string;
};