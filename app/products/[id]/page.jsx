"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Package, Star, CheckCircle, ArrowLeft, AlertOctagon, User, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BuyButton from "@/components/UI/buyButton";
import AddToCartButton from "@/components/UI/AddToCartButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatPrice } from "@/lib/formatPrice";

export default function ProductPage() {
    const params = useParams(); 
    const { isAuthenticated } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");

    // 1. تأمين الـ Hydration أوNoً لمنع تعارض السيرفر والعميل
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. جلب المنتج بمجرد جاهزية الروابط والمعرف
    useEffect(() => {
        if (mounted && params?.id) {
            fetchProduct();
        }
    }, [params?.id, mounted]);
    
    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${params.id}`); 
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(res.status === 404 ? "Product not found" : "Failed to load product data");
            }
            
            setProduct(data);
        } catch (err) {
            setError(err.message || "An error occurred while connecting to the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewLoading(true);
        setReviewError("");
        setReviewSuccess("");

        try {
            const res = await fetch(`/api/products/${params.id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewForm),
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "An error occurred while adding the review");
            }
            
            setReviewSuccess("Your review has been added successfully!");
            setProduct(data.product); // Update product to show new review
            setReviewForm({ rating: 5, comment: "" });
        } catch (err) {
            setReviewError(err.message);
        } finally {
            setReviewLoading(false);
        }
    };

    // شاشة الLoading القياسية أثناء جلب البيانات أو انتظار الـ Mounted
    if (!mounted || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Loading Product Details...</p>
            </div>
        );
    }

    // واجهة عرض الأخطاء المحمية
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
                <AlertOctagon className="h-12 w-12 text-red-600 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Notice</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
                <Link
                    href="/products"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to shop
                </Link>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="bg-gray-100 p-6 sm:p-8 dark:bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* تم إضافة الـ href بSuccess وإغNoق الوسوم */}
                <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors font-medium">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Store</span>
                </Link>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
                        
                        {/* معرض صور المنتج */}
                        <div className="aspect-square relative bg-gray-50 dark:bg-slate-950 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-900 flex items-center justify-center">
                            {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <Package className="h-20 w-20 text-slate-300 dark:text-slate-700" />
                            )}
                        </div>

                        {/* تفاصيل وبيانات الشراء */}
                        <div className="flex flex-col justify-between py-2">
                            <div className="space-y-4">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase inline-block bg-indigo-50 dark:bg-indigo-950/40 rounded-full px-3 py-1">
                                    {product.category}
                                </span>
                                
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {product.title}
                                </h1>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center text-yellow-500 gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-md text-sm font-bold">
                                        <Star className="w-4 h-4 fill-yellow-500" />
                                        <span>{product.rating ? product.rating.toFixed(1) : "0.0"} ({product.numReviews || 0})</span> 
                                    </div>
                                    
                                    {/* إصNoح منطق فحص وحقن المخزون والأيقونات */}
                                    {product.stock >= 1 ? (
                                        <span className="text-green-600 dark:text-green-400 font-semibold text-xs flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> In Stock ({product.stock})
                                        </span>
                                    ) : (
                                        <span className="text-red-500 font-semibold text-xs flex items-center gap-1">
                                            <AlertOctagon className="w-4 h-4" /> Out of Stock
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
                                    {product.description || "No description available for this product."}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                                <div className="mb-6">
                                    <span className="text-2xl font-black text-gray-950 dark:text-white">
                                        {formatPrice(product.price, product.currency || "EGP")}
                                    </span>
                                </div>
                                
                                {product.stock > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        <AddToCartButton product={product} />
                                        <BuyButton productId={product._id || product.id} />
                                    </div>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl cursor-not-allowed text-sm transition-all"
                                    >
                                        Out of Stock
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Reviews</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            {product.reviews && product.reviews.length > 0 ? (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {product.reviews.map((review, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">{review.name}</span>
                                                </div>
                                                <div className="flex items-center text-yellow-500 gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-500" : "text-gray-300 dark:text-gray-600"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                                            <span className="text-[10px] text-slate-400 mt-2 block">{new Date(review.createdAt).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Star className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet, be the first to review!</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add your review</h3>
                            {isAuthenticated ? (
                                <form onSubmit={handleReviewSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {reviewError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{reviewError}</div>}
                                    {reviewSuccess && <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-lg border border-green-100">{reviewSuccess}</div>}
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2">Rating (1 to 5)</label>
                                        <select 
                                            value={reviewForm.rating} 
                                            onChange={(e) => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                                            className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                        >
                                            <option value={5}>5 - Excellent</option>
                                            <option value={4}>4 - Very Good</option>
                                            <option value={3}>3 - Average</option>
                                            <option value={2}>2 - Bad</option>
                                            <option value={1}>1 - Very Bad</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2">Your Comment</label>
                                        <textarea 
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                            required
                                            rows={3}
                                            placeholder="Write your experience with the product..."
                                            className="w-full resize-none bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={reviewLoading}
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Submit Review
                                    </button>
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">You must Sign In to submit a review</p>
                                    <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
