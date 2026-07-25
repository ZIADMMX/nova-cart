"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// ⚠️ مNoحظة: تم Edit المسار إلى componant ليتطابق مع مجلد مشروعك الفعلي لكي No يظهر Error أثناء الـ Build
import { useAuth } from "@/components/providers/AuthProvider"; 
import AdminCharts from "@/components/AdminChart";
import { 
    User, ShoppingBag, DollarSign, ArrowRight, Package, Loader2, LayoutDashboard, Clock, AlertCircle, TrendingUp, BellRing, Settings, AlertTriangle, Users, Ticket 
} from "lucide-react"; 

export default function Dashboard() { 
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState(null); 

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.push("/auth/login");
            else if (user?.role?.toLowerCase() !== "admin" && user?.role?.toLowerCase() !== "super_admin") router.push("/"); 
        }
    }, [isAuthenticated, router, authLoading, user?.role]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchStats(); // Fetch immediately on mount, don't wait for auth check (parallel fetching)
        }
    }, [mounted]);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            setError("");
            const res = await fetch("/api/order/stats", { credentials: "include", cache: "no-store" });
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) return; // Silent fail, useAuth will handle redirect
                throw new Error("Failed to fetch dashboard statistics");
            }
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading Dashboard Engine...</p>
            </div>
        );
    }

    if (!isAuthenticated || (user?.role?.toLowerCase() !== "admin" && user?.role?.toLowerCase() !== "super_admin")) return null;

    const statCards = [
        {
            title: "Total Revenue",
            value: isLoading ? (
                <span className="inline-block w-16 h-6 bg-white/20 animate-pulse rounded-md mt-1"></span>
            ) : (
                `$${(stats?.totalRevenue || 0).toFixed(2)}`
            ),
            icon: DollarSign,
            cardClass: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 border-transparent",
            titleClass: "text-emerald-50",
            valueClass: "text-white",
            iconBg: "bg-white/20",
            iconColor: "text-white",
            arrowClass: "text-white/70 group-hover:text-white group-hover:translate-x-1",
            link: "/dashboard/orders",
        },
        {
            title: "Average Order Value",
            value: isLoading ? (
                <span className="inline-block w-12 h-6 bg-white/20 animate-pulse rounded-md mt-1"></span>
            ) : (
                `$${(stats?.averageOrderValue || 0).toFixed(2)}`
            ),
            icon: TrendingUp,
            cardClass: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20 border-transparent",
            titleClass: "text-blue-50",
            valueClass: "text-white",
            iconBg: "bg-white/20",
            iconColor: "text-white",
            arrowClass: "text-white/70 group-hover:text-white group-hover:translate-x-1",
            link: "/dashboard/orders",
        },
        {
            title: "Pending Orders",
            value: isLoading ? (
                <span className="inline-block w-12 h-6 bg-white/20 animate-pulse rounded-md mt-1"></span>
            ) : (
                stats?.totalPendingOrders || 0
            ),
            icon: BellRing,
            cardClass: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/20 border-transparent",
            titleClass: "text-amber-50",
            valueClass: "text-white",
            iconBg: "bg-white/20",
            iconColor: "text-white",
            arrowClass: "text-white/70 group-hover:text-white group-hover:translate-x-1",
            link: "/dashboard/orders",
        },
        {
            title: "Total Orders",
            value: isLoading ? (
                <span className="inline-block w-12 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1"></span>
            ) : (
                stats?.totalOrders || 0
            ),
            icon: ShoppingBag,
            cardClass: "bg-white dark:bg-gray-900 border-slate-200/60 dark:border-slate-800/80 shadow-xs",
            titleClass: "text-gray-400 dark:text-gray-500",
            valueClass: "text-gray-900 dark:text-white",
            iconBg: "bg-purple-100 dark:bg-purple-900/25",
            iconColor: "text-purple-600 dark:text-purple-400",
            arrowClass: "text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1",
            link: "/dashboard/orders",
        }, 
        {
            title: "Total Products",
            value: isLoading ? (
                <span className="inline-block w-12 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1"></span>
            ) : (
                stats?.totalProducts || 0
            ),
            icon: Package, 
            cardClass: "bg-white dark:bg-gray-900 border-slate-200/60 dark:border-slate-800/80 shadow-xs",
            titleClass: "text-gray-400 dark:text-gray-500",
            valueClass: "text-gray-900 dark:text-white",
            iconBg: "bg-indigo-100 dark:bg-indigo-900/25",
            iconColor: "text-indigo-600 dark:text-indigo-400",
            arrowClass: "text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1",
            link: "/dashboard/products",
        }, 
        {
            title: "Total Users",
            value: isLoading ? (
                <span className="inline-block w-12 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1"></span>
            ) : (
                stats?.totalUsers || 0
            ),
            icon: User,
            cardClass: "bg-white dark:bg-gray-900 border-slate-200/60 dark:border-slate-800/80 shadow-xs",
            titleClass: "text-gray-400 dark:text-gray-500",
            valueClass: "text-gray-900 dark:text-white",
            iconBg: "bg-cyan-100 dark:bg-cyan-900/25",
            iconColor: "text-cyan-600 dark:text-cyan-400",
            arrowClass: "text-gray-400 group-hover:text-cyan-600 group-hover:translate-x-1",
            link: "/dashboard/users",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6" dir="ltr">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl shadow-sm max-w-6xl mx-auto mb-8 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <LayoutDashboard className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h1 className="text-xl font-black">Admin Management Dashboard</h1>
                            <p className="text-indigo-100 text-xs mt-0.5">Welcome back, <span className="font-bold underline">{user?.name}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-black/10 px-3 py-1.5 rounded-lg text-indigo-100 font-mono">
                        <Clock className="w-3.5 h-3.5"/> 
                        <span>Live Store System Control</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="font-medium">Error: {error}</p>
                    </div> 
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {statCards.map((stat, idx) => (  
                        <Link key={idx} href={stat.link} className={`flex flex-col gap-2 rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg duration-300 group relative overflow-hidden ${stat.cardClass}`}> 
                            <div className="flex items-center justify-between relative z-10"> 
                                <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`}/>
                                </div>
                                <ArrowRight className={`w-4 h-4 transition-all duration-300 ${stat.arrowClass}`} />
                            </div>
                            <div className="relative z-10 mt-2">
                                <h3 className={`font-bold text-xs ${stat.titleClass}`}>{stat.title}</h3>
                                <p className={`text-2xl font-black mt-1 ${stat.valueClass}`}>{stat.value}</p>
                            </div>
                            {/* Decorative element for gradient cards */}
                            {idx < 3 && (
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                            )}
                        </Link>
                    ))}
                </div> 

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> 
                    <Link href="/dashboard/products" className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                                <Package className="w-6 h-6"/>
                            </div>  
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Catalog Products</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Edit, add, and delete store items inventory</p>
                            </div>  
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </Link>

                    <Link href="/dashboard/orders" className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Customer Orders</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View and manage all shipping billing states</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </Link>

                    <Link href="/dashboard/coupons" className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                                <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Coupons & Discounts</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create and manage discount coupon codes</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    </Link>

                    <Link href="/dashboard/settings" className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                                <Settings className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Site Settings</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update social media links shown in footer</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs mt-6 h-[320px] flex flex-col items-center justify-center mb-8">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <p className="text-xs text-gray-400 font-medium">Loading registrations chart...</p>
                    </div>
                ) : (
                    stats?.newUsersData && (
                        <div className="mb-8">
                            <AdminCharts data={stats.newUsersData} />
                        </div>
                    )
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأيسر: أحدث Orders (يأخذ مساحة أكبر) */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Store Orders</h3>
                            </div>
                            <Link href="/dashboard/orders" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View All</Link>
                        </div> 
                        
                        {isLoading ? (
                            <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center flex-grow">
                                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                                <p className="mt-1">Loading recent orders...</p>
                            </div>
                        ) : stats?.recentOrders?.length > 0 ? (
                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3">Order ID</th>
                                            <th className="px-5 py-3">Customer</th>
                                            <th className="px-5 py-3">Amount</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                                        {stats.recentOrders.map((order) => (
                                            <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    #{order._id.slice(-6).toUpperCase()}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-900 dark:text-white font-bold truncate max-w-[120px]">
                                                    {order.user?.name || "Guest Customer"}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-900 dark:text-white font-mono font-bold">
                                                    ${order.totalPrice?.toFixed(2) || "0.00"}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        order.status?.toLowerCase() === "paid" || order.status?.toLowerCase() === "delivered"
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-xs text-gray-400 flex-grow flex items-center justify-center flex-col">
                                <Package className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                                No recent orders placed yet.
                            </div>
                        )}
                    </div>

                    {/* القسم الأيمن: التنبيهات والأعضاء الجدد (WOW Factor) */}
                    <div className="flex flex-col gap-6">
                        
                        {/* 1. Low Stock Alerts */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-red-200/60 dark:border-red-900/40 overflow-hidden flex flex-col relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-red-50/50 dark:bg-red-900/10">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Low Stock Alerts</h3>
                            </div>
                            <div className="p-4 flex-grow flex flex-col gap-3">
                                {isLoading ? (
                                     <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
                                ) : stats?.lowStockProducts?.length > 0 ? (
                                    stats.lowStockProducts.map(product => (
                                        <div key={product._id} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-md bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                                    {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                                                </div>
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{product.title}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {product.stock} left
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 text-center py-4">All products are well stocked! 🎉</p>
                                )}
                            </div>
                        </div>

                        {/* 2. New Customers */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">New Customers</h3>
                            </div>
                            <div className="p-4 flex-grow flex flex-col gap-4">
                                {isLoading ? (
                                    <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                                ) : stats?.recentUsers?.length > 0 ? (
                                    stats.recentUsers.map(u => (
                                        <div key={u._id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                <span className="text-blue-600 dark:text-blue-400 text-xs font-black">{u.name?.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 text-center py-4">No new customers yet.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
