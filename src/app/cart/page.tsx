"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart();
    const shipping = subtotal > 50 ? 0 : 5;
    const total = subtotal + shipping;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4">
                <div className="p-8 bg-purple-50 rounded-full mb-6">
                    <ShoppingBag className="w-16 h-16 text-purple-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8 max-w-md text-center">
                    Looks like you haven't added anything to your cart yet. Explore our premium cosmetics collection to find something special.
                </p>
                <Link href="/cosmetics">
                    <Button className="bg-purple-600 hover:bg-purple-700 h-14 px-8 rounded-xl text-lg font-bold shadow-lg shadow-purple-100">
                        Start Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <Link href="/cosmetics" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shopping
                </Link>

                <h1 className="text-4xl font-black text-gray-900 mb-10">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 space-y-4">
                        {cartItems.map((item) => (
                            <div key={item.id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                                {/* Image */}
                                <div className="w-full md:w-32 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-purple-100" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-grow flex flex-col justify-between">
                                    <div className="flex justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                                            <p className="text-sm text-gray-500">Premium Grade</p>
                                        </div>
                                        <p className="text-xl font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 disabled:opacity-30"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-8 rounded-2xl border border-purple-100 shadow-xl shadow-purple-50/50 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-8">
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
                                {shipping > 0 && (
                                    <p className="text-[11px] text-gray-400">Add ${(50 - subtotal).toFixed(2)} more for FREE shipping</p>
                                )}
                                <div className="border-t border-gray-100 pt-4 flex justify-between">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-black text-purple-600">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Link href="/checkout">
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-xl text-lg font-bold shadow-lg shadow-purple-100 mb-4">
                                    Proceed to Checkout
                                </Button>
                            </Link>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                    <span>Secure checkout with SSL encryption</span>
                                </div>
                                <p className="text-[10px] text-gray-400 text-center leading-tight">
                                    Taxes calculated at checkout if applicable.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
