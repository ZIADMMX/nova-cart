"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Package, ShoppingBag, CheckCircle, Clock, XCircle, AlertCircle, Loader2
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
// 🛠️ استخدام Toast لعرض أخطاء التعديل دون إخفاء الجدول
import { toast } from "react-toastify";

// 🛠️ نقل الدوال الثابتة خارج الـ Component لمنع إعادة إنشائها مع كل Render
const getAvailableStatuses = (currentStatus) => {
    const allStatuses = ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"];
    return allStatuses.filter(status => status !== currentStatus);
};

const getstatusBadge = (status) => {
    const cfg = {
        Pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/25 dark:text-yellow-400", icon: <Clock className="w-4 h-4" /> },
        Processing: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/25 dark:text-blue-400", icon: <Package className="w-4 h-4" /> },
        Paid: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-400", icon: <CheckCircle className="w-4 h-4" /> },
        Shipped: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/25 dark:text-purple-400", icon: <Package className="w-4 h-4" /> },
        Delivered: { color: "bg-green-100 text-green-800 dark:bg-green-900/25 dark:text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
        Cancelled: { color: "bg-red-100 text-red-800 dark:bg-red-900/25 dark:text-red-400", icon: <XCircle className="w-4 h-4" /> },
    };
    const c = cfg[status] || cfg.Pending;
    const StatusIcon = c.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs ${c.color}`}>
            {StatusIcon}
            {status}
        </span>
    );
};

export default function OrderPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(""); // 🛠️ فصل أخطاء الجلب عن أخطاء التعديل
    const [mounted, setMounted] = useState(false);

    // States for pagination
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        setMounted(true);
    }, []);

    // 🛠️ استخدام useCallback لمنع إعادة بناء الدالة مع كل ريندر
    const fetchOrders = useCallback(async (currentPage = 1) => {
        try {
            setIsLoading(true);
            setFetchError("");
            const res = await fetch(`/api/order?page=${currentPage}&limit=${limit}`, {
                credentials: "include",
            });
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) return;
                throw new Error("Failed to fetch orders");
            }
            const data = await res.json();
            if (data.orders) {
                setOrders(data.orders);
                setPage(data.page);
                setPages(data.pages);
                setTotal(data.total);
            } else {
                setOrders(data);
                setPage(1);
                setPages(1);
                setTotal(data.length);
            }
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!isAuthenticated) router.push("/auth/login");
            else if (user?.role !== "admin" && user?.role !== "super_admin") router.push("/");
        }
    }, [authLoading, user?.role, isAuthenticated, router, mounted]);

    useEffect(() => {
        if (mounted) {
            fetchOrders(page); // Fetch immediately on mount
        }
    }, [mounted, page, fetchOrders]);



    const updateOrderStatus = async (orderId, newStatus) => {
        const previousOrders = [...orders]; // 🛠️ حفظ الحالة للـ Rollback
        try {
            setOrders(prevOrders =>
                prevOrders.map((o) => o._id === orderId ? { ...o, status: newStatus } : o)
            );

            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update order");
            }
            toast.success("Order status updated successfully!");
        } catch (error) {
            toast.error(error.message);
            setOrders(previousOrders); // 🛠️ تراجع عن التحديث بدون إعادة جلب البيانات
        }
    };

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    if (user?.role !== "admin" && user?.role !== "super_admin") return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mr-2" />
                <div className="text-gray-600 dark:text-gray-400 font-medium">Loading orders...</div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-red-600 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Error: {fetchError}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 sm:p-8 text-left" dir="ltr">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white font-sans">Order Management</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track and update customer purchases</p>
                    </div>
                </div>

                {/* 3 Purposeful Stat Cards for Orders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-emerald-50 text-xs font-bold mb-1">Current Page Sales</p>
                            <h3 className="text-2xl font-black">${orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0).toFixed(2)}</h3>
                        </div>
                        <ShoppingBag className="w-10 h-10 text-white/30" />
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-amber-50 text-xs font-bold mb-1">Pending Orders</p>
                            <h3 className="text-2xl font-black">{orders.filter(o => o.status === "Pending").length}</h3>
                        </div>
                        <Clock className="w-10 h-10 text-white/30" />
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-blue-50 text-xs font-bold mb-1">Completed</p>
                            <h3 className="text-2xl font-black">{orders.filter(o => o.status === "Delivered").length}</h3>
                        </div>
                        <CheckCircle className="w-10 h-10 text-white/30" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xs border border-slate-200 dark:bg-gray-900 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="text-lg font-medium">No orders found</p>
                                                <p className="text-sm mt-1">There are no orders in the system yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" key={order._id}>
                                            <td className="font-mono font-bold px-6 py-4 text-indigo-600 dark:text-indigo-400">
                                                <Link href={`/dashboard/orders/${order._id}`} className="hover:underline hover:text-indigo-500 transition-colors">
                                                    #{order._id.slice(-8).toUpperCase()}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {order.user?.name || "--"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {order.user?.email || "--"}
                                                    </p>
                                                    {order.shippingAddress ? (
                                                        <div className="mt-2">
                                                            <Link 
                                                                href={`/dashboard/orders/${order._id}`} 
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-black"
                                                            >
                                                                📍 {order.shippingAddress.city} (عرض العنوان بالتفصيل)
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500 font-bold block mt-1">لا يوجد شحن (رقمي)</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    {order.orderItems?.slice(0, 1).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <div className="w-8 h-8 relative bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {item.image ? (
                                                                    <Image src={item.image} alt={item.name || "Item"} fill sizes="32px" className="object-cover" />
                                                                ) : (
                                                                    <Package className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-gray-900 dark:text-gray-300 truncate max-w-[120px]">
                                                                {item.name} <span className="text-indigo-600 font-bold">(x{item.qty || item.quantity || 1})</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {order.orderItems?.length > 1 && (
                                                        <p className="text-[10px] text-indigo-500 font-bold pl-11">
                                                            + {order.orderItems.length - 1} more items
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900 dark:text-white">
                                                ${(order.totalPrice || order.total || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                }) : "--"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getstatusBadge(order.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                    value={order.status}
                                                    disabled={getAvailableStatuses(order.status).length === 0}
                                                    className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 outline-none font-medium"
                                                >
                                                    <option disabled value={order.status}>
                                                        Update Status
                                                    </option>
                                                    {getAvailableStatuses(order.status).map(stat => (
                                                        <option key={stat} value={stat}>
                                                            {stat}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {pages > 1 && (
                        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{" "}
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {Math.min(page * limit, total)}
                                </span>{" "}
                                of <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> orders
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <div className="hidden sm:flex items-center gap-1 font-bold text-xs">
                                    {Array.from({ length: pages }, (_, i) => i + 1).map((pNum) => (
                                        <button
                                            key={pNum}
                                            onClick={() => setPage(pNum)}
                                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${page === pNum
                                                    ? "bg-indigo-600 border-indigo-600 text-white font-black"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            {pNum}
                                        </button>
                                    ))}
                                </div>
                                <div className="sm:hidden text-xs font-bold text-slate-600 dark:text-slate-400">
                                    Page {page} of {pages}
                                </div>
                                <button
                                    onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                                    disabled={page === pages}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

