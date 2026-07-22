"use client";

import { useCart } from "@/components/providers/CartProvider"; // 🛠️ تم تصحيح المسار الإمNoئي لـ components
import { ShoppingBag, AlertTriangle } from "lucide-react";

export default function AddToCartButton({ product }) {
    const { addToCart } = useCart();

    // 🛠️ التحقق من توفر المنتج في المخزن لمنع البيع العشوائي
    const isOutOfStock = product?.stock !== undefined && product.stock <= 0;

    const handleAddToCart = () => {
        if (isOutOfStock) return; // حماية إضافية تمنع الإضافة بالError
        addToCart(product, 1);
    };

    return (
        <button
            onClick={handleAddToCart}
            disabled={isOutOfStock} // 🛡️ تعطيل الزر برمجياً لو المنتج خلصان
            className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 
                ${isOutOfStock 
                    ? "bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none" 
                    : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-lg active:scale-[0.98] cursor-pointer"
                }`}
        >
            {isOutOfStock ? (
                <>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span>نفد من المخزن</span>
                </>
            ) : (
                <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Add to Cart</span>
                </>
            )}
        </button>
    );
}
