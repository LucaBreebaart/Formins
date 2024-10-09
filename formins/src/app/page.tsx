"use client"

import React, { useState, useEffect } from 'react';
import StyledNavBar from './components/navBar/nav';
import Dashboard from './pages/dashboard/page';
import LoginPage from './(auth-pages)/sign-in/page';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className='relative min-h-dvh h-full'>
      {isLoggedIn ? (
        <div className='relative h-full min-h-dvh'>
          <StyledNavBar />
          <Dashboard />
        </div>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </main>
  );
}