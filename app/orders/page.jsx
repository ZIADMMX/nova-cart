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

    // 1. حماية المسار وتوجيه الزائر لصفحة Sign In إذا لم يكن مسجNoً
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, loading, router]);

    // 2. جلب Orders من الـ API
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchOrders = async () => {
            try {
                setLoadingOrders(true);
                const res = await fetch("/api/orders", { cache: "no-store" });
                if (!res.ok) {
                    throw new Error("Failed to load orders from server.");
                }
                const data = await res.json();
                if (data.success) {
                    setOrders(data.orders || []);
                } else {
                    throw new Error(data.message || "Error occurred while loading orders.");
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated]);

    // دوال مساعدة لتنسيق Order Status باللغة العربية والألوان المناسبة
    const getStatusConfig = (status) => {
        const statuses = {
            Pending: {
                text: "Pending",
                style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
                icon: <Clock className="w-4 h-4" />
            },
            Processing: {
                text: "Processing",
                style: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
                icon: <Loader2 className="w-4 h-4 animate-spin" />
            },
            Paid: {
                text: "Paid",
                style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
                icon: <CheckCircle className="w-4 h-4" />
            },
            Shipped: {
                text: "Shipped",
                style: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
                icon: <Truck className="w-4 h-4" />
            },
            Delivered: {
                text: "Delivered",
                style: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
                icon: <CheckCircle className="w-4 h-4" />
            },
            Cancelled: {
                text: "Cancelled",
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
                {/* زر Back to Home */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 mb-6 transition-colors font-medium">
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                    <span>Back to Home</span>
                </Link>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-sans">My Orders</h1>
                
                {loadingOrders ? (
                    // واجهة الLoading الذكي للطلبات
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your orders...</p>
                    </div>
                ) : error ? (
                    // واجهة الError في حال فشل الLoading
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                        <p className="text-red-700 dark:text-red-400 font-medium mb-2">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    // واجهة عدم وجود طلبات
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 p-12 text-center">
                        <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">It seems you haven't made any purchases yet.</p>
                        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer">
                            <ShoppingBag className="w-5 h-5" />
                            Browse Products Now
                        </Link>
                    </div>
                ) : (
                    // قائمة Orders الفعلية
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const config = getStatusConfig(order.status);
                            return (
                                <div key={order._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 overflow-hidden transition-all duration-300 hover:shadow-md">
                                    {/* ترويسة الطلب */}
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400 font-mono">Order ID: {order._id}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                Order Date: {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* شارة Order Status */}
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.style}`}>
                                                {config.icon}
                                                {config.text}
                                            </span>
                                            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                                                {order.totalPrice.toLocaleString("en-US")} $
                                            </span>
                                        </div>
                                    </div>

                                    {/* محتويات الطلب (Products) */}
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
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quantity: {item.qty}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{(item.price * item.qty).toLocaleString("en-US")} $</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Unit Price: {item.price} $</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* تفاصيل الShipping */}
                                    {order.shippingAddress && (
                                        <div className="px-5 pb-5 pt-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Order Shipping Details:</p>
                                            <p>👤 Recipient: {order.shippingAddress.fullName} | 📞 Phone: {order.shippingAddress.phone}</p>
                                            <p>📍 Address: {order.shippingAddress.city}، {order.shippingAddress.streetName}، {order.shippingAddress.address}</p>
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
