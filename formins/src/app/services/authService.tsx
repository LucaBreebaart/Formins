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

    // let photoURL = "";
    // if (profilePhoto) {
    //   if (typeof profilePhoto === 'string') {
    //     // If profilePhoto is already a URL, use it directly
    //     photoURL = profilePhoto;
    //   } else if (profilePhoto instanceof File) {
    //     // If profilePhoto is a File object, upload it
    //     const fileName = `${user.uid}-${Date.now()}.jpg`;
    //     const storageRef = ref(storage, fileName);
    //     await uploadBytes(storageRef, profilePhoto);
    //     photoURL = await getDownloadURL(storageRef);
    //   }
    // }

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