import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

// Function to upload image to Firebase Storage and return the download URL
export const handleUploadOfImage = async (uri: string, userId: string): Promise<string> => {
  try {
    // Convert URI to Blob
    const blob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const fileName = `${userId}-${Date.now()}.jpg`; // Generate a unique file name
    const imageRef = ref(storage, fileName);
    await uploadBytes(imageRef, blob);

    (blob as any).close();

    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image and saving to Firestore: ", error);
    throw error;
  }
};