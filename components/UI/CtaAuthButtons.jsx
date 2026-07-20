"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function CtaAuthButtons() {
    const { isAuthenticated, isLoading } = useAuth();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isLoading && !isAuthenticated && (
                <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/25">
                    Create Free Account
                </Link>
            )}
            <Link href="/products" className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">
                Browse Catalog
            </Link>
        </div>
    );
}
