import { Timestamp } from 'firebase/firestore';

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: Address;
    createdAt: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    deleted?: boolean;
    deletedAt?: Date | Timestamp;
}

export interface FirestoreUserProfile extends Omit<UserProfile, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    deletedAt?: Timestamp;
}

export type PartialUserProfile = Partial<UserProfile>;
export type UserProfileInput = Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt'>;