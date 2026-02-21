"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Gift, ShoppingBag, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Gift className="w-6 h-6 text-amber-600" />
          <span className="text-lg font-bold tracking-tight">
            GiftsFlow
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/#how-it-works" className="hover:text-amber-600">
            How it Works
          </Link>
          <Link href="/gifts" className="hover:text-amber-600">
            Try AI
          </Link>
          <Link href="/cosmetics" className="hover:text-amber-600">
            All Products
          </Link>
          {session?.user && ((session.user as any).role === "VENDOR" || (session.user as any).role === "ADMIN") && (
            <Link href="/portal" className="hover:text-amber-600">
              For Vendors
            </Link>
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/cart" className="relative group">
            <div className="p-2 hover:bg-purple-50 rounded-full transition-colors relative">
              <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-purple-600" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItems.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)}
                </span>
              )}
            </div>
          </Link>

          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{session.user.name}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                  <div className="px-4 py-2 border-b text-xs text-gray-500">
                    {(session.user as any).role}
                  </div>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 font-bold">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden"
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t px-6 py-4 space-y-4 text-sm">
          <Link href="#how-it-works" onClick={() => setOpen(false)}>
            How it Works
          </Link>
          <Link href="/gifts" onClick={() => setOpen(false)}>
            Try AI
          </Link>
          <Link href="/cosmetics" onClick={() => setOpen(false)}>
            All Products
          </Link>
          {session?.user && ((session.user as any).role === "VENDOR" || (session.user as any).role === "ADMIN") && (
            <Link href="/portal" onClick={() => setOpen(false)}>
              For Vendors
            </Link>
          )}

          {session?.user ? (
            <>
              <div className="flex items-center gap-2 py-2 border-t">
                <User className="w-4 h-4" />
                <span className="font-medium">{session.user.name}</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {(session.user as any).role}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-0 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setOpen(false)}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
