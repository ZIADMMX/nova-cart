"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        // تسجيل الError في السيرفر أو الكونسول للمتابعة
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-gray-950 px-4 py-12 font-sans" dir="rtl">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
                {/* خلفية جمالية خفيفة */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex flex-col items-center">
                    {/* أيقونة الError مع تأثير نبض */}
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center border border-rose-200 dark:border-rose-900/50 text-rose-500 mb-6 animate-pulse">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                        عذراً، حدث Error غير متوقع!
                    </h1>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        حدث Error غير متوقع أثناء معالجة الصفحة. يمكنك محاولة إعادة Loading الصفحة أو العودة إلى Home.
                    </p>

                    {/* تفاصيل الError للمطورين في بيئة التطوير */}
                    {process.env.NODE_ENV === "development" && (
                        <div className="w-full text-left bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl p-3.5 mb-6 overflow-x-auto max-h-40 font-mono text-[10px] text-rose-600 dark:text-rose-400">
                            {error?.message || error?.toString() || "No error message provided"}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={() => reset()}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                            إعادة المحاولة
                        </button>
                        
                        <Link
                            href="/"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
