"use client";

import { useEffect, useState, useRef, use } from "react";
import { ShoppingBag, Star, ChevronRight, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface Product {
    id: string;
    Product_Name: string;
    Brand: string;
    Category: string;
    Price_USD: number;
    Rating: number;
    Skin_Type: string;
    imageUrl?: string;
    content?: string;
}

export default function ProductPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, isHovered: false });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/product/${params.id}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setProduct(data);
            } catch (err) {
                console.error("Failed to fetch product:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!imageContainerRef.current) return;
        const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y, isHovered: true });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
                <Link href="/cosmetics">
                    <Button className="bg-purple-600 hover:bg-purple-700">Back to Store</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                            <ShoppingBag className="w-8 h-8 text-purple-600" />
                            GiftsFlow
                        </h1>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
                        <Link href="/cosmetics" className="hover:text-purple-600 transition-colors">Cosmetics</Link>
                        <Link href="/gifts" className="hover:text-purple-600 transition-colors">Gift Finder</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-8 overflow-hidden whitespace-nowrap">
                    <Link href="/cosmetics" className="hover:underline">Cosmetics</Link>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{product.Category}</span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{product.Product_Name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Images */}
                    <div className="lg:col-span-5 relative">
                        <div
                            ref={imageContainerRef}
                            className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center relative overflow-hidden cursor-crosshair group"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setZoomPos(prev => ({ ...prev, isHovered: false }))}
                        >
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.Product_Name}
                                    className="w-full h-full object-cover transition-transform duration-300"
                                />
                            ) : (
                                <ShoppingBag className="w-40 h-40 text-purple-100" />
                            )}

                            {/* Zoom Lens */}
                            {zoomPos.isHovered && product.imageUrl && (
                                <div
                                    className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                                    style={{
                                        background: `url('${product.imageUrl}') no-repeat`,
                                        backgroundSize: '200%',
                                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                                        opacity: 1
                                    }}
                                />
                            )}

                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-lg font-bold text-purple-600 shadow-sm border border-purple-50">
                                ${product.Price_USD}
                            </div>
                        </div>

                        {/* Static Placeholder info since we only have one "image" type right now */}
                        <div className="flex gap-4 mt-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center hover:border-purple-600 cursor-pointer transition-colors">
                                    <ShoppingBag className="w-8 h-8 text-purple-100" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Info */}
                    <div className="lg:col-span-4">
                        <div className="border-b border-gray-100 pb-6 mb-6">
                            <p className="text-purple-600 font-bold uppercase tracking-widest text-sm mb-2">{product.Brand}</p>
                            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">{product.Product_Name}</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span>{product.Rating} / 5</span>
                                </div>
                                <span className="text-gray-400 text-sm">3k+ views this month</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Product Description</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {product.content || `This premium ${product.Category.toLowerCase()} from ${product.Brand} is specifically formulated for ${product.Skin_Type.toLowerCase()} skin. Experience professional-grade beauty with high-quality ingredients designed to deliver visible results.`}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-6">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Skin Type</p>
                                    <p className="font-bold text-gray-900">{product.Skin_Type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Category</p>
                                    <p className="font-bold text-gray-900">{product.Category}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                    <span>Authienticity Guaranteed & Premium Quality</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Truck className="w-5 h-5 text-purple-500" />
                                    <span>Free Shipping on orders over $50</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Add to Cart */}
                    <div className="lg:col-span-3">
                        <Card className="rounded-2xl border-purple-100 shadow-xl shadow-purple-50 sticky top-24">
                            <CardContent className="p-6">
                                <div className="mb-6">
                                    <p className="text-3xl font-black text-gray-900">${product.Price_USD}</p>
                                    <p className="text-green-600 text-sm font-bold mt-1">In Stock & Ready to Ship</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <p className="text-sm text-gray-500">Scheduled delivery available</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium bg-gray-50 p-2 rounded-lg">
                                        <RefreshCcw className="w-4 h-4" />
                                        30-Day Easy Returns
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-xl text-lg font-bold shadow-lg shadow-purple-100">
                                        Add to Cart
                                    </Button>
                                    <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 h-14 rounded-xl text-lg font-bold">
                                        Buy Now
                                    </Button>
                                    <p className="text-[10px] text-gray-400 text-center mt-2 leading-tight">
                                        Secure Transaction • Data Encrypted
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
