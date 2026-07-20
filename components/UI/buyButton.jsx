"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function BuyButton({ productId }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const handleBuy = () => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        router.push(`/checkout?productId=${productId}`);
    };

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>شراء الآن</span>
                </>
            )}
        </button>
    );
}
