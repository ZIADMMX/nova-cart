"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    User, Shield, Mail, Calendar, ArrowLeft, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Users
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function UsersPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    // States for pagination
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    
    // حالات للميكرو أنيماشن والتفاعل
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!isAuthenticated) router.push("/auth/login");
            else if (user?.role !== "admin" && user?.role !== "super_admin") router.push("/");
        }
    }, [authLoading, user?.role, isAuthenticated, router, mounted]);

    useEffect(() => {
        if (mounted) {
            fetchUsers(page);
        }
    }, [mounted, page]);

    const fetchUsers = async (currentPage = page) => {
        try {
            setIsLoading(true);
            setError("");
            const res = await fetch(`/api/users?page=${currentPage}&limit=${limit}`, {
                credentials: "include",
            });
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) return;
                throw new Error("Failed to fetch users");
            }
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
                setPage(data.page);
                setPages(data.pages);
                setTotal(data.total);
            } else {
                setUsers(data);
                setPage(1);
                setPages(1);
                setTotal(data.length);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // دالة تحديث الرتبة للـ Super Admin
    const handleRoleChange = async (targetUserId, newRole) => {
        if (user?.role !== "super_admin" && user?.role !== "admin") {
            setError("You do not have permission to update roles.");
            return;
        }

        if (user?.role === "admin" && newRole === "super_admin") {
            setError("Admins cannot assign the Super Admin role.");
            return;
        }

        // الحماية من تخفيض رتبة الشخص لنفسه
        if (targetUserId === user?._id) {
            setWarningMessage("Safety Warning: You cannot change your own Super Admin role to prevent locking yourself out!");
            setTimeout(() => setWarningMessage(""), 5000);
            return;
        }

        try {
            setUpdatingUserId(targetUserId);
            setError("");
            setSuccessMessage("");
            
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: targetUserId, role: newRole }),
                credentials: "include",
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "Failed to update user role");
            }

            // تحديث قائمة المستخدمين محلياً
            setUsers(prevUsers => 
                prevUsers.map(u => u._id === targetUserId ? { ...u, role: newRole } : u)
            );

            setSuccessMessage(`User role successfully updated to ${newRole.toUpperCase()}!`);
            setTimeout(() => setSuccessMessage(""), 4000);

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const getRoleConfig = (role) => {
        const configs = {
            super_admin: {
                badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
                iconColor: "text-purple-500",
                text: "Super Admin"
            },
            admin: {
                badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
                iconColor: "text-emerald-500",
                text: "Admin"
            },
            user: {
                badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
                iconColor: "text-blue-500",
                text: "User"
            },
        };
        return configs[role] || { badge: "bg-gray-50 text-gray-700 border-gray-200", iconColor: "text-gray-500", text: role?.toUpperCase() || "USER" };
    };

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    if (user?.role !== "admin" && user?.role !== "super_admin") return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 text-left" dir="ltr">
            <div className="max-w-6xl mx-auto">
                
                {/* الترويسة الأنيقة */}
                <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 border border-slate-200/50 dark:border-slate-800">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white font-sans flex items-center gap-2">
                                <Users className="w-6 h-6 text-indigo-600" />
                                {user?.role === "super_admin" ? "SuperAdmin Control Panel" : "User Management"}
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium">
                                {user?.role === "super_admin" 
                                    ? "Assign/remove administrative capabilities and manage user access rights." 
                                    : "View users registration logs and roles list."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3 Purposeful Stat Cards for Users */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-blue-100 text-xs font-bold mb-1">Total Registered</p>
                            <h3 className="text-2xl font-black">{total}</h3>
                        </div>
                        <Users className="w-10 h-10 text-white/30" />
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-purple-50 text-xs font-bold mb-1">Administrators</p>
                            <h3 className="text-2xl font-black">{users.filter(u => u.role === "admin" || u.role === "super_admin").length}</h3>
                        </div>
                        <Shield className="w-10 h-10 text-white/30" />
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-cyan-50 text-xs font-bold mb-1">Regular Users</p>
                            <h3 className="text-2xl font-black">{users.filter(u => u.role === "user").length}</h3>
                        </div>
                        <User className="w-10 h-10 text-white/30" />
                    </div>
                </div>

                {/* رسائل التنبيهات والأخطاء التفاعلية */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-sm text-rose-700 dark:text-rose-400 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-semibold">{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <p className="font-semibold">{successMessage}</p>
                    </div>
                )}

                {warningMessage && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p className="font-semibold">{warningMessage}</p>
                    </div>
                )}

                {/* جدول المستخدمين الرئيسي */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Fetching active users list...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Current Role</th>
                                        {(user?.role === "admin" || user?.role === "super_admin") && <th className="px-6 py-4">Update Access</th>}
                                        <th className="px-6 py-4">Registered Date</th>
                                        <th className="px-6 py-4">User ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                                    {users.map((u) => {
                                        const config = getRoleConfig(u.role);
                                        const isSelf = u._id === user?._id;
                                        
                                        return (
                                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" key={u._id}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold uppercase shadow-sm">
                                                            {u.name ? u.name[0] : "U"}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-gray-950 dark:text-white block text-sm">
                                                                {u.name || "Unknown"}
                                                                {isSelf && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 ml-2 px-1.5 py-0.5 rounded-md font-mono">You</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium">{u.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs ${config.badge}`}>
                                                        <Shield className={`w-3.5 h-3.5 ${config.iconColor}`} />
                                                        {config.text}
                                                    </span>
                                                </td>
                                                
                                                {/* عمود التحكم المتاح للأدمن والسوبر أدمن */}
                                                {(user?.role === "admin" || user?.role === "super_admin") && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                disabled={isSelf || updatingUserId === u._id || (user?.role === "admin" && u.role === "super_admin")}
                                                                value={u.role || "user"}
                                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                                className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all ${isSelf || (user?.role === "admin" && u.role === "super_admin") ? "opacity-50 cursor-not-allowed" : "hover:border-slate-300 dark:hover:border-slate-700"}`}
                                                            >
                                                                <option value="user">User (Normal)</option>
                                                                <option value="admin">Admin</option>
                                                                {user?.role === "super_admin" && <option value="super_admin">Super Admin</option>}
                                                            </select>
                                                            
                                                            {updatingUserId === u._id && (
                                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                                            )}
                                                        </div>
                                                    </td>
                                                )}

                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>
                                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric"
                                                            }) : "N/A"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-400 select-all text-xs">
                                                    {u._id}
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                    of <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> users
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
                                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                                    page === pNum
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
                )}
            </div>
        </div>
    );
}
