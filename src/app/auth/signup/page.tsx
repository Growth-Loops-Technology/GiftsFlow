"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";

type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signIn("google", { 
        callbackUrl: "/",
        // For new users, they'll be created as CUSTOMER by default
        // They can change role in settings later
      });
    } catch (err) {
      setError("Google sign up failed. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
              <p className="text-muted-foreground mb-4">
                Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6" />
            Create Account
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Join GiftsFlow and start shopping or selling
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                At least 8 characters
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Vendor</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {role === "CUSTOMER"
                  ? "Buy and discover products"
                  : role === "VENDOR"
                  ? "Sell your products on GiftsFlow"
                  : "Manage the platform"}
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Sign Up with Email"}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign Up with Google
            </Button>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-amber-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
