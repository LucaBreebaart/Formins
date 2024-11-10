"use client"

import React, { useState } from "react";
import { Button, Input } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import { handleRegister, handlelogin } from "@/app/services/authService";
import { EyeFilledIcon } from "../../../../public/icons/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../../../public/icons/EyeSlashFilledIcon";
import { BackgroundLines } from "@/components/ui/background-lines";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(false);
  const [isVisible1, setIsVisible1] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleVisibility1 = () => setIsVisible1(!isVisible1);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (isLogin) {
        await handlelogin(email, password);
        router.push('/');
      } else {
        const success = await handleRegister({
          username,
          email,
          password,
          profilePhoto: "" //add file input
        });
        if (success) {
          setMessage("Registration successful! You can now log in.");
          setIsLogin(true);
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <BackgroundLines className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 bg-gray-1/80 backdrop-blur-sm p-8 rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-gray-400">
            {isLogin 
              ? "Enter your details to sign in" 
              : "Enter your details to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="bordered"
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
              label: "text-gray-400"
            }}
          />

          {!isLogin && (
            <Input
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="bordered"
              classNames={{
                input: "bg-transparent",
                inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                label: "text-gray-400"
              }}
            />
          )}

          <Input
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="bordered"
            endContent={
              <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <EyeSlashFilledIcon className="text-xl text-default-400" />
                ) : (
                  <EyeFilledIcon className="text-xl text-default-400" />
                )}
              </button>
            }
            type={isVisible ? "text" : "password"}
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
              label: "text-gray-400"
            }}
          />

          {!isLogin && (
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant="bordered"
              endContent={
                <button className="focus:outline-none" type="button" onClick={toggleVisibility1}>
                  {isVisible1 ? (
                    <EyeSlashFilledIcon className="text-xl text-default-400" />
                  ) : (
                    <EyeFilledIcon className="text-xl text-default-400" />
                  )}
                </button>
              }
              type={isVisible1 ? "text" : "password"}
              classNames={{
                input: "bg-transparent",
                inputWrapper: "bg-gray-2/50 border-gray-3 hover:border-green-1",
                label: "text-gray-400"
              }}
            />
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}

          <Button 
            type="submit" 
            className="w-full bg-secondary text-white font-semibold transition-colors"
          >
            {isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-sm text-gray-400 hover:text-green-1 transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </BackgroundLines>
  );
};

export default AuthPage;