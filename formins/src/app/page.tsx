"use client"

import React, { useState, useEffect } from 'react';
import StyledNavBar from './components/navBar/nav';
import Dashboard from './pages/dashboard/page';
import LoginPage from './(auth-pages)/sign-in/page';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { Spinner } from '@nextui-org/react';
import Profile from './profile/page';

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
    return <div className='relative flex align-middle content-center min-h-dvh h-full bg-gray-1 text-foreground'>
      <Spinner
        size="lg"
        labelColor="primary"
      />
    </div>;
  }

  return (
    <main className='relative min-h-dvh h-full bg-gray-1 text-foreground'>
      {isLoggedIn ? (
        <div className='relative h-full min-h-dvh dark'>
          <StyledNavBar />
          <Dashboard />
          {/* <Profile/> */}
        </div>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </main>
  );
}