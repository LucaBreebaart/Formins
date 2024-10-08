"use client";

import React, { useState } from "react";
import { Button, Input, Card, CardBody, CardHeader, Link } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import { handleRegister, handlelogin  } from "@/app/services/authService";
import { EyeFilledIcon } from "../../images/icons/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../images/icons/EyeSlashFilledIcon";

interface LoginPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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
        // Login
        await handlelogin(email, password);
        setMessage("Login successful!");
        onLogin();
      } else {
        // Register
        const success = await handleRegister({
          username,
          email,
          password,
          profilePhoto: "" //add a file input for profile photo
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
    <main className="flex justify-center items-center w-full min-h-dvh dark bg-primary">
      <Card className="flex justify-center w-full max-w-sm h-fit">
        <CardHeader className="flex justify-center ">
          <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Register"}</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              variant="bordered"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {!isLogin && (
              <Input
                type="text"
                label="Username"
                variant="bordered"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}

            <Input
              label="Password"
              variant="bordered"
              endContent={
                <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                  {isVisible ? (
                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              type={isVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                variant="bordered"
                endContent={
                  <button className="focus:outline-none" type="button" onClick={toggleVisibility1}>
                    {isVisible1 ? (
                      <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                      <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    )}
                  </button>
                }
                type={isVisible1 ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}

            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
            <Button type="submit" color="secondary" fullWidth>
              {isLogin ? "Login" : "Register"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              className="text-white"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsLogin(!isLogin);
                setError("");
                setMessage("");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Login"}
            </Link>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}

export default AuthPage;