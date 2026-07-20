"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export function HeroAuthButton() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading || isAuthenticated) return null;

    return (
        <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-purple-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-md"
        >
            <UserPlus className="w-5 h-5 text-indigo-400 hover:text-purple-600" />
            Create Account
        </Link>
    );
}

export function CtaAuthButton() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading || isAuthenticated) return null;

    return (
        <Link 
            href="/auth/register" 
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 duration-300 rounded-xl font-bold transition-all hover:scale-[1.02] group"
        >
            Create Account
        </Link>
    );
}
