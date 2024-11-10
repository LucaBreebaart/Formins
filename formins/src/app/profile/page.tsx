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
    <main className='relative min-h-dvh h-full bg-gray-1 text-foreground'>
      <StyledNavBar />
      <div className="flex relative justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex justify-center">
            <h1 className="text-2xl font-bold">Profile Information</h1>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={profile.firstName || ''}
                  onChange={handleChange}
                  variant="bordered"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={profile.lastName || ''}
                  onChange={handleChange}
                  variant="bordered"
                />
              </div>

              <Input
                label="Phone Number"
                name="phoneNumber"
                value={profile.phoneNumber || ''}
                onChange={handleChange}
                variant="bordered"
              />

              <div className="space-y-4">
                <Input
                  label="Street Address"
                  name="address.street"
                  value={profile.address?.street || ''}
                  onChange={handleChange}
                  variant="bordered"
                />
                <Input
                  label="City"
                  name="address.city"
                  value={profile.address?.city || ''}
                  onChange={handleChange}
                  variant="bordered"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="State"
                    name="address.state"
                    value={profile.address?.state || ''}
                    onChange={handleChange}
                    variant="bordered"
                  />
                  <Input
                    label="Zip Code"
                    name="address.zipCode"
                    value={profile.address?.zipCode || ''}
                    onChange={handleChange}
                    variant="bordered"
                  />
                  <Input
                    label="Country"
                    name="address.country"
                    value={profile.address?.country || ''}
                    onChange={handleChange}
                    variant="bordered"
                  />
                </div>
              </div>

              {error && <p className="text-red-500">{error}</p>}
              {success && <p className="text-green-500">{success}</p>}

              <Button type="submit" color="primary" className="w-full">
                Save Profile
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}