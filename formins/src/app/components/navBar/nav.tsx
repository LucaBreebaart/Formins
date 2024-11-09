"use client"

import React from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Link as NextUILink, Button } from "@nextui-org/react";
import { handleSignOut } from "@/app/services/authService";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function StyledNavBar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: "Profile", href: "/profile" },
    { name: "Dashboard", href: "/dashboard" },
    // { name: "Log Out", href: "#", action: handleLogout }
  ];

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
          <Link href="/dashboard" className="font-bold text-inherit">
            FORMINS
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem isActive={isActive('/profile')}>
          <Link href="/profile" className={`${isActive('/profile') ? 'text-primary' : 'text-foreground'}`}>
            Profile
          </Link>
        </NavbarItem>
        <NavbarItem isActive={isActive('/dashboard')}>
          <Link href="/dashboard" className={`${isActive('/dashboard') ? 'text-primary' : 'text-foreground'}`}>
            Dashboard
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button onClick={handleLogout} color="danger">
            Log Out
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            {item.action ? (
              <Button
                onClick={item.action}
                color={item.name === "Log Out" ? "danger" : "primary"}
                className="w-full"
                size="lg"
              >
                {item.name}
              </Button>
            ) : (
              <Link
                href={item.href}
                className={`w-full text-lg ${isActive(item.href) ? 'text-primary' : 'text-foreground'}`}
              >
                {item.name}
              </Link>
            )}
          </NavbarMenuItem>
        ))}
      </NavbarMenu> */}
    </Navbar>
  );
}