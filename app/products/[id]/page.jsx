"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Package, Star, CheckCircle, ArrowLeft, AlertOctagon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BuyButton from "@/components/UI/buyButton";
import AddToCartButton from "@/components/UI/AddToCartButton";

export default function ProductPage() {
    const params = useParams(); 
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    // 1. تأمين الـ Hydration أولاً لمنع تعارض السيرفر والعميل
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
                throw new Error(res.status === 404 ? "المنتج غير موجود" : "فشل في تحميل بيانات المنتج");
            }
            
            setProduct(data);
        } catch (err) {
            setError(err.message || "حدث خطأ أثناء الاتصال بالخادم.");
        } finally {
            setLoading(false);
        }
    };

    // شاشة التحميل القياسية أثناء جلب البيانات أو انتظار الـ Mounted
    if (!mounted || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">جارٍ تحميل تفاصيل المنتج...</p>
            </div>
        );
    }

    // واجهة عرض الأخطاء المحمية
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
                <AlertOctagon className="h-12 w-12 text-red-600 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تنبيه</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
                <Link
                    href="/products"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    العودة للتسوق تصفح المنتجات
                </Link>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="bg-gray-100 p-6 sm:p-8 dark:bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* تم إضافة الـ href بنجاح وإغلاق الوسوم */}
                <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors font-medium">
                    <ArrowLeft className="h-5 w-5" />
                    <span>العودة للمتجر</span>
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
                                        <span>4.5</span> 
                                    </div>
                                    
                                    {/* إصلاح منطق فحص وحقن المخزون والأيقونات */}
                                    {product.stock >= 1 ? (
                                        <span className="text-green-600 dark:text-green-400 font-semibold text-xs flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> متوفر في المخزن ({product.stock})
                                        </span>
                                    ) : (
                                        <span className="text-red-500 font-semibold text-xs flex items-center gap-1">
                                            <AlertOctagon className="w-4 h-4" /> نفذت الكمية
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
                                    {product.description || "لا يوجد وصف متوفر لهذا المنتج حالياً في متجرنا."}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                                <div className="mb-6">
                                    <span className="text-2xl font-black text-gray-950 dark:text-white">
                                        {product.price ? product.price.toFixed(2) : "0.00"} {product.currency || "ر.س"}
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
                                        انتهى من المخزن
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
