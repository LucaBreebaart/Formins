"use client"

import React, { useEffect, useState } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Button } from "@nextui-org/react";
import { handleSignOut } from "@/app/services/authService";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from "@/app/firebase";

export default function StyledNavBar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await handleSignOut();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="dark relative z-100">
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="font-bold text-inherit">
            FORMINS
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {isLoggedIn && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem isActive={isActive('/profile')}>
            <Link href="/profile" className={`${isActive('/profile') ? 'text-foreground' : 'text-foreground'}`}>
              Profile
            </Link>
          </NavbarItem>
          <NavbarItem isActive={isActive('/')}>
            <Link href="/" className={`${isActive('/') ? 'text-foreground' : 'text-foreground'}`}>
              Dashboard
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}

      <NavbarContent justify="end">
        {isLoggedIn ? (
          <NavbarItem>
            <Button onClick={handleLogout} color="danger">
              Log Out
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Button as={Link} href="/sign-in" color="primary">
              Sign In
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      {isLoggedIn && isMenuOpen && (
        <NavbarMenu>
          <NavbarMenuItem>
            <Link
              href="/profile"
              className={`w-full text-lg ${isActive('/profile') ? 'text-foreground' : 'text-foreground'}`}
            >
              Profile
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              href="/"
              className={`w-full text-lg ${isActive('/') ? 'text-foreground' : 'text-foreground'}`}
            >
              Dashboard
            </Link>
          </NavbarMenuItem>
        </NavbarMenu>
      )}
    </Navbar>
  );
}