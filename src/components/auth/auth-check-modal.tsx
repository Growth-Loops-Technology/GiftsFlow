"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, X } from "lucide-react";

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onAuthenticated?: () => void;
}

export function AuthCheckModal({ isOpen, onClose, onAuthenticated }: Readonly<AuthModalProps>) {
  const router = useRouter();
  const { data: session } = useSession();
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  // If user is already logged in, show their orders
  useEffect(() => {
    if (session?.user && isOpen) {
      fetchPreviousOrders();
    }
  }, [session, isOpen]);

  const fetchPreviousOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setPreviousOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const handleSignIn = async () => {
    await signIn();
    onClose();
    onAuthenticated?.();
  };

  const handleSignUp = () => {
    router.push("/auth/signup");
    onClose();
  };

  if (!isOpen) return null;

  // If already logged in, show welcome message and continue shopping
  if (session?.user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-2xl font-bold">Welcome Back! 👋</CardTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Credentials */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Logged In As</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Name:</strong> {session.user.name || "Not set"}</p>
                {(session.user as any).role && (
                  <p><strong>Account Type:</strong> {(session.user as any).role}</p>
                )}
              </div>
            </div>

            {/* Previous Orders */}
            {previousOrders.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3">Previous Orders ({previousOrders.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {previousOrders.map((order) => (
                    <div key={`${order.date}-${order.total}`} className="text-xs text-gray-600 border-l-2 border-amber-400 pl-2 py-1">
                      <p className="font-medium">{order.date}</p>
                      <p className="text-gray-500">${order.total?.toFixed(2) || "0.00"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previousOrders.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-3 bg-gray-50 rounded-lg">
                No previous orders yet
              </p>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-lg font-semibold"
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not logged in, show login/signup options
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Sign in or create an account to add items to your cart
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Sign In */}
          <Button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Sign In to Your Account
          </Button>

          {/* Sign Up */}
          <Button
            onClick={handleSignUp}
            className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create New Account
          </Button>

          {/* Continue as Guest (optional) */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-10 rounded-lg text-gray-600 hover:bg-gray-100 border-gray-200"
          >
            Continue Without Signing In
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By signing up, you'll save your cart, track orders, and get exclusive deals.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
