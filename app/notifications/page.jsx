"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider"; 
import { useRouter } from "next/navigation";
import { Bell, Loader2, Info, Package, CheckCheck, AlertCircle, ShoppingBag } from "lucide-react";
import MarkAllReadButton from "@/components/UI/MarkAllReadButton"; 

export default function NotificationsPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();   
    const [error, setError] = useState(""); 
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setisLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();   

    // 1. تأمين الـ Hydration ومنع مشاكل عدم تطابق رندرة العميل والسيرفر
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. حماية المسار والتوجيه الفوري للزائر غير المسجل
    useEffect(() => {
        if (mounted && !authLoading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, authLoading, router, mounted]);

    // 3. استدعاء الإشعارات فور التأكد من هوية العميل وجاهزية الواجهة
    useEffect(() => {
        if (mounted && isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated, mounted]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications`, {
                cache: "no-store",
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error("فشل في تحميل الإشعارات، يرجى المحاولة لاحقاً.");
            }
            const data = await res.json();
            setNotifications(data.notifications || data); // دعم قراءة البيانات بشكل مرن
        } catch (err) {
            setError(err.message);
        } finally {
            setisLoading(false);
        }
    };

    // تحديث حالة إشعار منفصل كمقروء عند الضغط عليه
    const markAsRead = async (id) => {
        try {
            // تحديث الواجهة فورياً أمام المستخدم لتجربة سريعة (Optimistic UI Update)
            setNotifications(prev => 
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );

            const res = await fetch(`/api/notifications/${id}/read`, {
                method: "PUT",
                credentials: "include",
            }); 
            if (!res.ok) {
                throw new Error("فشل في تحديث حالة الإشعار بالسيرفر.");
            }
        } catch (error) {
            console.error("خطأ أثناء تحديث حالة الإشعار:", error.message);    
        }
    };

    // التحديث المحلي الفوري لجميع الإشعارات كمقروءة عند ضغط الزر الرئيسي للتحسين
    const handleMarkAllAsReadLocal = () => {
        setNotifications(prev => prev.map((n) => ({ ...n, isRead: true })));
    };
        
    // 🛠️ تم تصحيح بناء الدالة بإضافة السهم البرمجي المفقود => لتعمل بسلام
    const getNotificationIcon = (type) => {
        switch (type) {
            case "order":
                return <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case "product":
                return <Package className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case "alert":
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            case "warning":
                return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
            case "success":
                return <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
            case "info":
            default:
                return <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        }
    };
    
    // واجهة التحميل الأنيقة والموحدة
    if (!mounted || authLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 dir-rtl text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
                <p className="text-xs text-slate-400 font-medium">جاري تحميل صندوق الإشعارات...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;
    
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12 dir-rtl text-right"> 
            {/* البانر العلوي المحسن بالكامل وحل مشكلة تداخل الطباعة */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-gray-900 dark:to-gray-800 text-white p-6 rounded-b-3xl shadow-sm mb-8">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative">
                            <Bell className="w-5 h-5 text-white" />
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
                                    {unreadNotifications}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-black">مركز الإشعارات</h1>
                            <p className="text-indigo-200 text-[10px] mt-0.5">تابع تحديثات طلباتك وعروضنا أولاً بأول</p>
                        </div>
                    </div>
                    
                    {unreadNotifications > 0 && (
                        <MarkAllReadButton onSuccess={handleMarkAllAsReadLocal} />
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 mb-6 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* صندوق العرض عند خلو المجلد تماماً */}
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-8 text-center shadow-xs">
                        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                        <h3 className="text-slate-800 dark:text-white font-bold text-sm mb-1">صندوق الإشعارات فارغ</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">ليست هناك أي تنبيهات أو رسائل مسجلة لك حالياً.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n) => (
                            <div 
                                key={n._id} 
                                className={`bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex items-start justify-between gap-4 transition-all duration-200 ${
                                    n.isRead 
                                        ? "opacity-65 border-slate-100 dark:border-slate-850" 
                                        : "hover:border-indigo-500 shadow-xs cursor-pointer bg-gradient-to-l from-indigo-50/20 via-transparent to-transparent"
                                }`} 
                                onClick={() => !n.isRead && markAsRead(n._id)}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg shrink-0">
                                        {getNotificationIcon(n.type)}
                                    </div>
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className={`text-sm text-slate-900 dark:text-white truncate ${!n.isRead ? "font-bold" : "font-medium"}`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono shrink-0">
                                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString("ar-EG", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }) : ""}
                                            </span>
                                        </div>
                                        {/* تنظيف دمج الحقول المكررة ليعرض النص المتاح بنظافة */}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {n.message || n.body || n.content}
                                        </p>
                                    </div>
                                </div>

                                {/* 🛠️ تصحيح آلية أيقونة التحقق المقروءة لتظهر في موضعها الصحيح */}
                                <div className="shrink-0 pt-1">
                                    {n.isRead ? (
                                        <CheckCheck className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                                    ) : (
                                        <span className="w-2 h-2 bg-indigo-600 rounded-full flex shrink-0 shadow-sm shadow-indigo-600/50" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 
