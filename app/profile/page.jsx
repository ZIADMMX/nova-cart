"use client";

import { useEffect, useState } from "react";
// ⚠️ المسار الصحيح للمكونات في مشروعك
import { useAuth } from "@/components/providers/AuthProvider"; 
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Calendar, Loader2, ArrowLeft, LogOut, Settings, PackageOpen } from "lucide-react";
import Link from "next/link";

function ProfilePage() {
    const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        window.location.href = "/";
    };

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading secure profile...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="ltr">
            {/* البانر العلوي الترحيبي */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white pb-24 pt-10 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">Account Overview</h1>
                                <p className="text-indigo-100 text-sm mt-1 opacity-90">Manage your personal data and store settings</p>
                            </div>
                        </div>
                        
                        <div>
                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-white/20 backdrop-blur-md ${
                                user.role === 'admin' 
                                ? 'bg-emerald-500/20 text-emerald-100' 
                                : 'bg-white/10 text-white'
                            }`}>
                                <Shield className="w-4 h-4" />
                                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Customer"}
                            </span> 
                        </div>
                    </div>
                </div>
            </div>

            {/* تفاصيل البيانات الشخصية */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 pb-12">
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl shadow-indigo-900/5">
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* عمود الأفاتار والصورة */}
                        <div className="flex flex-col items-center text-center space-y-4 md:w-1/3">
                            <div className="w-32 h-32 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-lg shadow-indigo-500/30 border-4 border-white dark:border-gray-900 relative">
                                {user.name ? user.name[0].toUpperCase() : "U"}
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full"></div>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">{user.name || "Unknown User"}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email || "No email linked"}</p>
                            </div>
                            
                            {user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super_admin" ? (
                                <Link href="/dashboard" className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800/30">
                                    <Settings className="w-4 h-4" />
                                    Admin Dashboard
                                </Link>
                            ) : (
                                <Link href="/orders" className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors border border-purple-100 dark:border-purple-800/30">
                                    <PackageOpen className="w-4 h-4" />
                                    My Orders
                                </Link>
                            )}

                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/20 mt-2 cursor-pointer">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>

                        {/* عمود البيانات التفصيلية */}
                        <div className="md:w-2/3">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                Personal Information
                            </h3>
                            
                            <div className="space-y-4">
                                {[
                                    { icon: User, label: 'Full Name', value: user.name || "Not specified" },
                                    { icon: Mail, label: 'Email Address', value: user.email || "Not specified" },
                                    { icon: Shield, label: 'Account Role', value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Customer" },
                                    { icon: Calendar, label: 'Account ID', value: user._id || user.id || "N/A", mono: true }
                                ].map((item, index) => (
                                    <div key={index} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 border-b border-slate-100 dark:border-slate-800 pb-4 group-last:border-0 group-last:pb-0">
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className={`text-sm text-gray-900 dark:text-gray-100 ${item.mono ? 'font-mono text-indigo-600 dark:text-indigo-400 font-bold' : 'font-semibold'}`}>
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// المكون الرئيسي المصدّر لتأمين الـ Mounted ومنع الـ Hydration Errors
export default function ProfileWrapper() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false); 

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, mounted]);

    if (!mounted || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    } 

    return <ProfilePage />;
}
