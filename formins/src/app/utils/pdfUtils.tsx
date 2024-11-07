// app/utils/pdfUtils.ts
export const dataURLtoUint8Array = (dataURL: string): Uint8Array => {
    try {
      const base64 = dataURL.split(',')[1];
      if (!base64) {
        throw new Error('Invalid data URL format');
      }
      const buffer = Buffer.from(base64, 'base64');
      return new Uint8Array(buffer);
    } catch (error) {
      console.error('Error converting dataURL to Uint8Array:', error);
      throw error;
    }
  };
  
  // Convert pixel measurements to PDF points (72 points = 1 inch)
  export const pixelsToPDFPoints = (pixels: number): number => {
    return (pixels * 72) / 96; // Assuming 96 DPI
  }