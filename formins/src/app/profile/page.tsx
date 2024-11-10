"use client"

import React, { useEffect, useState } from "react";
import { Button, Input, Card, CardBody, CardHeader, Spinner } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import { auth } from "@/app/firebase";
import { getUserProfile, updateUserProfile } from "../services/profileService";
import { UserProfile } from "../types/user";
import StyledNavBar from "../components/ui/Navbar";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/sign-in');
        return;
      }

      loadProfile(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const loadProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const user = auth.currentUser;
    if (!user) {
      setError("No user logged in");
      return;
    }

    try {
      await updateUserProfile(user.uid, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        address: profile.address
      });
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StyledNavBar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-gray-400 mt-2">Update your personal information and address</p>
          </div>

          <div className="bg-gray-1/80 backdrop-blur-sm rounded-xl p-6 space-y-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={profile.firstName || ''}
                      onChange={handleChange}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                        label: "text-gray-400"
                      }}
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={profile.lastName || ''}
                      onChange={handleChange}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                        label: "text-gray-400"
                      }}
                    />
                    <Input
                      label="Phone Number"
                      name="phoneNumber"
                      value={profile.phoneNumber || ''}
                      onChange={handleChange}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                        label: "text-gray-400"
                      }}
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Address</h2>
                  <div className="space-y-6">
                    <Input
                      label="Street Address"
                      name="address.street"
                      value={profile.address?.street || ''}
                      onChange={handleChange}
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                        label: "text-gray-400"
                      }}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="City"
                        name="address.city"
                        value={profile.address?.city || ''}
                        onChange={handleChange}
                        variant="bordered"
                        classNames={{
                          input: "bg-transparent",
                          inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                          label: "text-gray-400"
                        }}
                      />
                      <Input
                        label="State"
                        name="address.state"
                        value={profile.address?.state || ''}
                        onChange={handleChange}
                        variant="bordered"
                        classNames={{
                          input: "bg-transparent",
                          inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                          label: "text-gray-400"
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Zip Code"
                        name="address.zipCode"
                        value={profile.address?.zipCode || ''}
                        onChange={handleChange}
                        variant="bordered"
                        classNames={{
                          input: "bg-transparent",
                          inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                          label: "text-gray-400"
                        }}
                      />
                      <Input
                        label="Country"
                        name="address.country"
                        value={profile.address?.country || ''}
                        onChange={handleChange}
                        variant="bordered"
                        classNames={{
                          input: "bg-transparent",
                          inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                          label: "text-gray-400"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback Messages */}
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                {success && (
                  <p className="text-green-500 text-sm">{success}</p>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary text-white font-semibold transition-colors"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}