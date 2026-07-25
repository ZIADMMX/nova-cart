"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
    Loader2, 
    ArrowLeft, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    CreditCard, 
    ShoppingBag, 
    ClipboardCheck, 
    Copy,
    CheckCircle2
} from "lucide-react";
import Image from "next/image";

export default function OrderDetailsPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const orderId = params.id;

    const router = useRouter();
    const { isAuthenticated, user: authUser, loading: authLoading } = useAuth();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [copiedField, setCopiedField] = useState("");

    // حماية المسار
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push("/auth/login");
            } else if (authUser?.role !== "admin" && authUser?.role !== "super_admin") {
                router.push("/");
            }
        }
    }, [isAuthenticated, authLoading, authUser, router]);

    // جلب Order Details
    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/orders/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                setError(data.message || "Failed to load Order Details.");
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred while connecting to the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && (authUser?.role === "admin" || authUser?.role === "super_admin")) {
            fetchOrderDetails();
        }
    }, [orderId, isAuthenticated, authUser]);

    // تحديث Order Status
    const handleUpdateStatus = async (newStatus) => {
        try {
            setUpdatingStatus(true);
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setOrder(prev => ({ ...prev, status: newStatus }));
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (err) {
            console.error(err);
            alert("Error occurred while updating status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    // نسخ البيانات للحافظة
    const handleCopyText = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(""), 2000);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-semibold text-slate-400">Loading Order Details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl max-w-md w-full text-center">
                    <p className="text-red-400 font-bold mb-6">{error}</p>
                    <button onClick={() => router.push("/dashboard/orders")} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
                        Back to Orders Management
                    </button>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const getStatusStyle = (status) => {
        const styles = {
            Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            Processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            Paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            Shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            Delivered: "bg-green-500/10 text-green-400 border-green-500/20",
            Cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        return styles[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
    };

    const statusTranslations = {
        Pending: "Pending",
        Processing: "Processing",
        Paid: "Paid",
        Shipped: "Shipped",
        Delivered: "Delivered",
        Cancelled: "Cancelled",
    };

    return (
        <main className="min-h-screen bg-slate-950 pb-20 pt-10 px-4 sm:px-6 md:px-8 font-sans text-right" dir="rtl">
            <div className="max-w-5xl mx-auto">
                {/* العودة */}
                <button 
                    onClick={() => router.push("/dashboard/orders")} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Orders List
                </button>

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <span className="font-mono text-indigo-400">#{order._id.slice(-8).toUpperCase()}</span>
                            <span>Order Details</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-2 font-mono flex items-center gap-1.5 justify-end">
                            {new Date(order.createdAt).toLocaleString("ar-EG")}
                            <Calendar className="w-3.5 h-3.5" />
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${getStatusStyle(order.status)}`}>
                            {statusTranslations[order.status] || order.status}
                        </span>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-400 hidden sm:inline-block">Edit Status:</label>
                            <select 
                                value={order.status}
                                disabled={updatingStatus}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Paid">Paid</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* عمود Products والملخص (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* قائمة Products */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md">
                            <h2 className="text-base font-black text-white flex items-center gap-2 mb-6">
                                <ShoppingBag className="w-5 h-5 text-indigo-400" /> Requested Products
                            </h2>

                            <div className="divide-y divide-slate-800">
                                {order.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center">
                                        <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-6 h-6 text-slate-700" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1">Quantity: {item.qty} × {item.price}$</p>
                                        </div>
                                        <div className="text-left font-black text-white text-sm">
                                            ${(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ملخص الحساب */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
                            <div className="flex justify-between text-sm font-bold text-slate-400">
                                <span>Subtotal</span>
                                <span className="text-white">${order.totalPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-400">
                                <span>Shipping & Delivery</span>
                                <span className="text-emerald-400 font-bold">Free</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-400">
                                <span>Payment Method</span>
                                <span className="text-indigo-400 font-bold flex items-center gap-1">
                                    {order.paymentMethod === "COD"
                                        ? "Cash on Delivery (COD)"
                                        : order.paymentMethod === "Stripe"
                                            ? "Credit Card (Stripe)"
                                            : order.paymentMethod || "Credit Card"
                                    }
                                    <CreditCard className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-800 flex justify-between text-lg font-black text-white">
                                <span>Total Amount</span>
                                <span className="text-indigo-400 font-mono">${order.totalPrice?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* عمود بيانات العميل وShipping (1/3) */}
                    <div className="space-y-6">
                        {/* بيانات العميل كحساب */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md">
                            <h2 className="text-base font-black text-white flex items-center gap-2 mb-6">
                                <User className="w-5 h-5 text-indigo-400" /> Buyer Account
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black">
                                        {order.user?.name ? order.user.name[0].toUpperCase() : "U"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-white truncate">{order.user?.name || "--"}</p>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{order.user?.email || "--"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* تفاصيل Shipping Address الكلي */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-6 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-black text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-400" /> Detailed Shipping Address
                                </h2>
                                {order.shippingAddress && (
                                    <button 
                                        onClick={() => {
                                            const details = `Name: ${order.shippingAddress.fullName}\nPhone: ${order.shippingAddress.phone}\nRegion: ${order.shippingAddress.city}\nStreet: ${order.shippingAddress.streetName || "Not specified"}\nAddress: ${order.shippingAddress.address}`;
                                            handleCopyText(details, "all");
                                        }}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        {copiedField === "all" ? (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                                <span className="text-emerald-400">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy All</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {order.shippingAddress ? (
                                <div className="space-y-4 text-sm leading-relaxed">
                                    {/* Name */}
                                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400">Recipient Name</p>
                                            <p className="font-bold text-white mt-1 truncate">{order.shippingAddress.fullName}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyText(order.shippingAddress.fullName, "name")}
                                            className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-colors"
                                        >
                                            {copiedField === "name" ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400">Phone Number</p>
                                            <p className="font-bold text-indigo-400 mt-1 font-mono">{order.shippingAddress.phone}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyText(order.shippingAddress.phone, "phone")}
                                            className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-colors"
                                        >
                                            {copiedField === "phone" ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Region / State */}
                                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400">Region / State</p>
                                        <p className="font-bold text-white mt-1">{order.shippingAddress.city}</p>
                                    </div>

                                    {/* Street */}
                                    {order.shippingAddress.streetName && (
                                        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400">Street Name</p>
                                                <p className="font-bold text-white mt-1 wrap-break-word">{order.shippingAddress.streetName}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleCopyText(order.shippingAddress.streetName, "street")}
                                                className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
                                            >
                                                {copiedField === "street" ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}

                                    {/* Address بالتفصيل */}
                                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400">Address Details</p>
                                            <p className="font-semibold text-slate-300 mt-1 wrap-break-word">{order.shippingAddress.address}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyText(order.shippingAddress.address, "addressDetail")}
                                            className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
                                        >
                                            {copiedField === "addressDetail" ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs font-bold text-rose-500 text-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
                                    No shipping information recorded for this order.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
