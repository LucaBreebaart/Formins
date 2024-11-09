export const dataURLtoUint8Array = (dataURL: string): Uint8Array => {
  try {
    // Remove the data URL prefix
    const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '');
    // Create a buffer from the base64 string
    const buffer = Buffer.from(base64, 'base64');
    return new Uint8Array(buffer);
  } catch (error) {
    console.error('Error converting dataURL to Uint8Array:', error);
    throw error;
  }
};