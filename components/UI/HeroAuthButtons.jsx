"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, UserPlus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function HeroAuthButtons() {
    const { isAuthenticated, isLoading } = useAuth();

    return (
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-xl shadow-white/10 group"
            >
                <ShoppingBag className="w-5 h-5" />
                Explore Catalog
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {!isLoading && !isAuthenticated ? (
                <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                >
                    <UserPlus className="w-5 h-5 text-indigo-400" />
                    Join Now
                </Link>
            ) : null}
        </div>
    );
}
