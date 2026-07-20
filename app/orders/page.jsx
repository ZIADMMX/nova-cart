"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, ArrowLeft, ShoppingBag, Clock, CheckCircle, Truck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function OrderPage() {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState(null);

    // 1. حماية المسار وتوجيه الزائر لصفحة تسجيل الدخول إذا لم يكن مسجلاً
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, loading, router]);

    // 2. جلب الطلبات من الـ API
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchOrders = async () => {
            try {
                setLoadingOrders(true);
                const res = await fetch("/api/orders", { cache: "no-store" });
                if (!res.ok) {
                    throw new Error("فشل في تحميل الطلبات من الخادم.");
                }
                const data = await res.json();
                if (data.success) {
                    setOrders(data.orders || []);
                } else {
                    throw new Error(data.message || "حدث خطأ أثناء تحميل الطلبات.");
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError(err.message || "حدث خطأ غير متوقع.");
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated]);

    // دوال مساعدة لتنسيق حالة الطلب باللغة العربية والألوان المناسبة
    const getStatusConfig = (status) => {
        const statuses = {
            Pending: {
                text: "قيد الانتظار",
                style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
                icon: <Clock className="w-4 h-4" />
            },
            Processing: {
                text: "قيد المعالجة",
                style: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
                icon: <Loader2 className="w-4 h-4 animate-spin" />
            },
            Paid: {
                text: "تم الدفع",
                style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
                icon: <CheckCircle className="w-4 h-4" />
            },
            Shipped: {
                text: "تم الشحن",
                style: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
                icon: <Truck className="w-4 h-4" />
            },
            Delivered: {
                text: "تم التوصيل",
                style: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
                icon: <CheckCircle className="w-4 h-4" />
            },
            Cancelled: {
                text: "ملغي",
                style: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
                icon: <AlertTriangle className="w-4 h-4" />
            }
        };
        return statuses[status] || { text: status, style: "bg-gray-50 text-gray-700 border-gray-200", icon: null };
    };

    if (loading || (!isAuthenticated && !loading)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 sm:p-8 dir-rtl text-right">
            <div className="max-w-4xl mx-auto">
                {/* زر العودة للرئيسية */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 mb-6 transition-colors font-medium">
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                    <span>العودة للرئيسية</span>
                </Link>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-sans">طلباتي</h1>
                
                {loadingOrders ? (
                    // واجهة التحميل الذكي للطلبات
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">جاري تحميل طلباتك...</p>
                    </div>
                ) : error ? (
                    // واجهة الخطأ في حال فشل التحميل
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                        <p className="text-red-700 dark:text-red-400 font-medium mb-2">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    // واجهة عدم وجود طلبات
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 p-12 text-center">
                        <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات بعد</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">يبدو أنك لم تقم بأي عملية شراء حتى الآن.</p>
                        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer">
                            <ShoppingBag className="w-5 h-5" />
                            تصفح المنتجات الآن
                        </Link>
                    </div>
                ) : (
                    // قائمة الطلبات الفعلية
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const config = getStatusConfig(order.status);
                            return (
                                <div key={order._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 overflow-hidden transition-all duration-300 hover:shadow-md">
                                    {/* ترويسة الطلب */}
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400 font-mono">رقم الطلب: {order._id}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* شارة حالة الطلب */}
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.style}`}>
                                                {config.icon}
                                                {config.text}
                                            </span>
                                            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                                                {order.totalPrice.toLocaleString("ar-EG")} $
                                            </span>
                                        </div>
                                    </div>

                                    {/* محتويات الطلب (المنتجات) */}
                                    <div className="p-5 divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {order.orderItems.map((item, idx) => (
                                            <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                                                <div className="w-16 h-16 relative shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                                    <Image 
                                                        src={item.image || "/placeholder.png"} 
                                                        alt={item.name} 
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الكمية: {item.qty}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{(item.price * item.qty).toLocaleString("ar-EG")} $</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">سعر الوحدة: {item.price} $</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* تفاصيل الشحن */}
                                    {order.shippingAddress && (
                                        <div className="px-5 pb-5 pt-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">تفاصيل شحن الطلب:</p>
                                            <p>👤 المستلم: {order.shippingAddress.fullName} | 📞 الهاتف: {order.shippingAddress.phone}</p>
                                            <p>📍 العنوان: {order.shippingAddress.city}، {order.shippingAddress.streetName}، {order.shippingAddress.address}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
