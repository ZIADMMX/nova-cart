"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider"; // تم استخدام مسار المكونات القياسي
import { useCart } from "@/components/providers/CartProvider";
import { Loader2, Package, CircleCheck, ShoppingCart, LogIn, ArrowLeft, XCircle } from "lucide-react";

// 1. مكون واجهة النجاح الأساسي والذي يقرأ روابط الـ URL
function SuccessPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { clearCart } = useCart();
    const [loading, setLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const session_id = searchParams.get("session_id");
    const paymentStatus = searchParams.get("paymentStatus");
    const signature = searchParams.get("signature");
    const merchantOrderId = searchParams.get("merchantOrderId");
    const paymobHmac = searchParams.get("hmac");
    const paymobOrder = searchParams.get("order");

    useEffect(() => {
        // مؤقت افتراضي للتحقق أو التحويل في حال فشل الجلسة
        const timer = setTimeout(() => {
            if (!session_id && !(paymentStatus && signature && merchantOrderId) && !(paymobHmac && paymobOrder)) {
                router.push("/");
            }
        }, 3000);

        const verifySession = async () => {
            // 1. التحقق من كاشير أولاً إذا كان التوجيه قادماً منها
            if (paymentStatus && signature && merchantOrderId) {
                try {
                    const response = await fetch(`/api/kashier/verify?${searchParams.toString()}`);
                    const data = await response.json();
                    if (data.success) {
                        setVerificationStatus(true);
                        clearCart();
                    } else {
                        setVerificationStatus(false);
                    }
                } catch (error) {
                    console.error("خطأ في التحقق من كاشير:", error);
                    setVerificationStatus(false);
                } finally {
                    setLoading(false);
                }
                return;
            }

            // 2. التحقق من Paymob إذا كان التوجيه قادماً منها
            if (paymobHmac && paymobOrder) {
                try {
                    const response = await fetch(`/api/paymob/verify?${searchParams.toString()}`);
                    const data = await response.json();
                    if (data.success) {
                        setVerificationStatus(true);
                        clearCart();
                    } else {
                        setVerificationStatus(false);
                    }
                } catch (error) {
                    console.error("خطأ في التحقق من Paymob:", error);
                    setVerificationStatus(false);
                } finally {
                    setLoading(false);
                }
                return;
            }

            // 3. التحقق من Stripe كخيار بديل
            if (!session_id) {
                setVerificationStatus(false);
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/stripe/verify-session?session_id=${session_id}`);
                const data = await response.json();
                if (data.success) {
                    setVerificationStatus(true);
                    clearCart(); // Clear the cart after successful checkout
                } else {
                    setVerificationStatus(false);
                }
            } catch (error) {
                console.error("خطأ في التحقق من الجلسة:", error);
                setVerificationStatus(false);
            } finally {
                setLoading(false);
            }
        };

        verifySession();

        return () => clearTimeout(timer);
    }, [session_id, paymentStatus, signature, merchantOrderId, paymobHmac, paymobOrder, searchParams, router]);

    // عرض شاشة التحميل إذا كانت الجلسة قيد الفحص
    if (loading) {
        return <LoadingFallback />;
    }

    if (verificationStatus === false) {
        return (
            <div className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 max-w-xl w-full text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">فشل التحقق من الدفع!</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    عذراً، لم نتمكن من تأكيد عملية الدفع الخاصة بك. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <Link href="/" className="w-full sm:w-auto text-sm font-bold text-white flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all rounded-xl shadow-md">
                        <ArrowLeft className="w-4 h-4" />
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 max-w-xl w-full text-center">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                <CircleCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">تم التحقق من الطلب بنجاح!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                شكراً لتسوقك معنا، سيتم التواصل معك قريباً لتأكيد تفاصيل الشحن.
            </p>

            {(session_id || merchantOrderId) && (
                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono mb-8 w-full break-all">
                    معرف الطلب: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{(session_id || merchantOrderId).slice(-12)}</span>
                </div>
            )}

            {/* الأزرار والروابط وتنسيقها القياسي بمضاعفات الـ 100 لتجنب مشاكل التنسيق */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                {isAuthenticated ? (
                    <Link href="/orders" className="w-full sm:w-auto text-sm font-bold text-white flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all rounded-xl shadow-md shadow-indigo-600/10">
                        <Package className="w-4 h-4" />
                        الذهاب للطلبات
                    </Link>
                ) : (
                    <Link href="/login" className="w-full sm:w-auto text-sm font-bold text-white flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all rounded-xl shadow-md shadow-indigo-600/10">
                        <LogIn className="w-4 h-4" />
                        تسجيل الدخول
                    </Link>
                )}

                <Link href="/products" className="w-full sm:w-auto text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all rounded-xl">
                    <ShoppingCart className="w-4 h-4" />
                    المنتجات
                </Link>

                <Link href="/" className="w-full sm:w-auto text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center justify-center gap-2 py-3 px-5 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    الرئيسية
                </Link>
            </div>
        </div>
    );
}

// 2. مكون التحميل المنفصل كـ Fallback
function LoadingFallback() {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-sm w-full">
            <Loader2 className="animate-spin w-10 h-10 text-indigo-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">جارٍ التحقق من حالة الدفع والطلب...</p>
        </div>
    );
}

// 3. المكون الرئيسي المصدّر للملف والمغلف بـ Suspense لحماية أداء الصفحة
export default function SuccessOrder() {
    const { loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
                <LoadingFallback />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
            <Suspense fallback={<LoadingFallback />}>
                <SuccessPageContent />
            </Suspense>
        </div>
    );
}
