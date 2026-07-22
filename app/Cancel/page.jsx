"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, ShoppingBag } from "lucide-react";

export default function CancelOrder() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
                
                {/* أيقونة الCancel */}
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <XCircle className="w-12 h-12 text-rose-600 dark:text-rose-400" />
                </div>

                {/* النصوص */}
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 font-sans">
                    Payment Cancelled
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium">
                    Your payment has been cancelled successfully. No charges were made. You can return to shopping at any time.
                </p>

                {/* أزرار التنقل */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link 
                        href="/products" 
                        className="w-full sm:w-auto text-sm font-bold text-white flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Return to Products
                    </Link>
                    
                    <Link 
                        href="/" 
                        className="w-full sm:w-auto text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all rounded-xl cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Home Page
                    </Link>
                </div>
            </div>
        </main>
    );
}

