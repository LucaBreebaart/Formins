import React, { useEffect, useState } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Button } from "@nextui-org/react";
import Image from "next/image";
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
    <Navbar 
      onMenuOpenChange={setIsMenuOpen} 
      className="bg-gray-1/80 backdrop-blur-md border-b border-gray-3/50"
      maxWidth="full"
      height="4rem"
    >
      <NavbarContent className="basis-1/5 sm:basis-full">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-white"
        />
        <NavbarBrand className="gap-3">
          <Image
            src="images/logo.svg"
            alt="Logo"
            width={60}
            height={20}
          />
        </NavbarBrand>
      </NavbarContent>

      {isLoggedIn && (
        <NavbarContent className="hidden sm:flex gap-6" justify="center">
          <NavbarItem isActive={isActive('/')}>
            <Link 
              href="/" 
              className={`relative px-3 py-2 text-sm transition-colors duration-200 
                ${isActive('/') 
                  ? 'text-green-1 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-1' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              Dashboard
            </Link>
          </NavbarItem>
          <NavbarItem isActive={isActive('/profile')}>
            <Link 
              href="/profile" 
              className={`relative px-3 py-2 text-sm transition-colors duration-200 
                ${isActive('/profile') 
                  ? 'text-green-1 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-1' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              Profile
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}

      <NavbarContent justify="end">
        {isLoggedIn ? (
          <NavbarItem>
            <Button 
              onClick={handleLogout} 
              className="hover:bg-gray-2/50 transition-colors"
            >
              Log Out
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Button 
              as={Link} 
              href="/sign-in" 
              className="bg-secondary text-black bold font-medium hover:bg-green-2 transition-colors"
            >
              Sign In
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      {isLoggedIn && isMenuOpen && (
        <NavbarMenu className="bg-gray-1/95 backdrop-blur-md pt-6 gap-6">
          <NavbarMenuItem>
            <Link
              href="/"
              className={`w-full text-base py-2 ${
                isActive('/') 
                  ? 'text-green-1' 
                  : 'text-gray-400 hover:text-white transition-colors'
              }`}
            >
              Dashboard
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              href="/profile"
              className={`w-full text-base py-2 ${
                isActive('/profile') 
                  ? 'text-green-1' 
                  : 'text-gray-400 hover:text-white transition-colors'
              }`}
            >
              Profile
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Button 
              onClick={handleLogout} 
              className="bg-transparent border border-gray-3 text-white hover:bg-gray-2/50 transition-colors mt-4"
              radius="full"
              size="sm"
              fullWidth
            >
              Log Out
            </Button>
          </NavbarMenuItem>
        </NavbarMenu>
      )}
    </Navbar>
  );
}