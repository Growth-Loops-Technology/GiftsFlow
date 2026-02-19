"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { cartItems } = useCart();

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
          <Link href="/portal" className="hover:text-amber-600">
            For Vendors
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-6">
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
          <Link href="/gifts">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 font-bold px-6">Start Gifting</Button>
          </Link>
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
          <Link href="/portal" onClick={() => setOpen(false)}>
            For Vendors
          </Link>

          <Link href="/gifts">
            <Button className="w-full mt-2">
              Start Gifting
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
