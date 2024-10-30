// src/app/services/authService.tsx

import { User, UserCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface RegisterData {
  username: string;
  email: string;
  password: string;
  profilePhoto: File | string | null;
}

export const handleRegister = async ({ username, email, password, profilePhoto }: RegisterData): Promise<boolean> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      username: username,
      email: user.email,
      // profilePhoto: photoURL,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error in handleRegister:", error);
    return false;
  }
};

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

export const handleSignOut = (): void => {
  signOut(auth)
    .then(() => {
      console.log('User signed out successfully');
    })
    .catch((error: Error) => {
      console.log('Error signing out:', error);
    });
};

export const handlelogin = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error in handlelogin:", error);
    throw error;
  }
};