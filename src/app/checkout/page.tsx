"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Truck, CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
    const { cartItems, subtotal, clearCart } = useCart();
    const [isOrdered, setIsOrdered] = useState(false);

    const shipping = subtotal > 50 ? 0 : 5;
    const total = subtotal + shipping;

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        setIsOrdered(true);
        clearCart();
    };

    if (isOrdered) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4">
                <div className="p-8 bg-green-50 rounded-full mb-6 animate-bounce">
                    <CheckCircle2 className="w-16 h-16 text-green-600" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-2 text-center">Order Placed Successfully!</h1>
                <p className="text-gray-500 mb-8 max-w-md text-center">
                    Thank you for your purchase. We've sent a confirmation email to your inbox and will notify you when your items ship.
                </p>
                <Link href="/">
                    <Button className="bg-purple-600 hover:bg-purple-700 h-14 px-8 rounded-xl text-lg font-bold shadow-lg shadow-purple-100">
                        Return to Home
                    </Button>
                </Link>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">No items to checkout</h1>
                <Link href="/cosmetics">
                    <Button className="bg-purple-600 hover:bg-purple-700">Go to Store</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart
                </Link>

                <h1 className="text-4xl font-black text-gray-900 mb-10">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form Section */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handlePlaceOrder} className="space-y-8">
                            {/* Shipping Info */}
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Truck className="w-6 h-6 text-purple-600" />
                                    <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">First Name</label>
                                        <Input placeholder="Jane" required className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Last Name</label>
                                        <Input placeholder="Doe" required className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                        <Input type="email" placeholder="jane@example.com" required className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Shipping Address</label>
                                        <Input placeholder="123 Beauty Lane" required className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">City</label>
                                        <Input placeholder="New York" required className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Postal Code</label>
                                        <Input placeholder="10001" required className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info (Simplified/Mock) */}
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <CreditCard className="w-6 h-6 text-purple-600" />
                                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                                </div>
                                <div className="p-4 rounded-xl border-2 border-purple-100 bg-purple-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <p className="font-bold text-gray-900">Mock Card Payment</p>
                                            <p className="text-xs text-gray-500 text-purple-400 font-medium">Card ending in 4242</p>
                                        </div>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border-4 border-purple-600" />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-16 rounded-2xl text-xl font-black shadow-xl shadow-purple-100 transition-all active:scale-95">
                                Place Order • ${total.toFixed(2)}
                            </Button>
                        </form>
                    </div>

                    {/* Summary Section */}
                    <div className="lg:col-span-5">
                        <Card className="rounded-2xl border-gray-100 shadow-sm sticky top-24">
                            <CardContent className="p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">In Your Bag</h2>
                                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="w-8 h-8 text-purple-100" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="font-bold text-green-600">
                                            {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-4 flex justify-between">
                                        <span className="text-lg font-bold text-gray-900">Total</span>
                                        <span className="text-2xl font-black text-purple-600">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
