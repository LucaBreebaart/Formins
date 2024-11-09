import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, FirestoreUserProfile } from "../types/user";

const convertTimestampsToDates = (data: FirestoreUserProfile): UserProfile => {
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    deletedAt: data.deletedAt?.toDate(),
  };
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data() as FirestoreUserProfile;
      return convertTimestampsToDates(data);
    }
    return null;
  } catch (error) {
    console.error("Error getting profile:", error);
    throw error;
  }
};

export const createUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const timestamp = Timestamp.now();
    
    const initialProfile: FirestoreUserProfile = {
      uid,
      username: profileData.username || '',
      email: profileData.email || '',
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      phoneNumber: profileData.phoneNumber || '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      createdAt: timestamp
    };

    await setDoc(userRef, initialProfile);
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Clean undefined values and convert dates to timestamps
    const cleanedData = Object.entries(profileData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        if (value instanceof Date) {
          acc[key] = Timestamp.fromDate(value);
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    await updateDoc(userRef, {
      ...cleanedData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export const deleteUserProfile = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw error;
  }
};