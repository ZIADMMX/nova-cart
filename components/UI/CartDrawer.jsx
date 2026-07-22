"use client";

import { useCart } from "@/components/providers/CartProvider"; // 🛠️ تصحيح المسار الإمNoئي الصحيح
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image"; // 🛠️ تفعيل اNoستفادة من مكون تحسين الصور
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/formatPrice";

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout");
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 z-[70] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <ShoppingBag className="w-5 h-5" /> Shopping Cart
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 gap-4">
              <ShoppingBag className="w-16 h-16 opacity-50" />
              <p>سلتك فارغة حالياً</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  {/* Image wrapper with custom next/image optimization */}
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shrink-0">
                    <Image 
                      src={item.imageUrl || "https://placehold.co/100x100"} // 🛠️ استخدام imageUrl بدNoً من image
                      alt={item.title || "product"} // 🛠️ استخدام title بدNoً من name
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* 🛠️ استخدام title بدNoً من name لNoنسجام مع الـ DB */}
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {formatPrice(item.price, item.currency || "EGP")}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium dark:text-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center mb-4 text-lg font-bold dark:text-white">
              <span>Total Price:</span>
              <span>{formatPrice(cartTotal, "EGP")}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform hover:scale-[1.02]"
            >
              إتمام الشراء الآن
            </button>
          </div>
        )}
      </div>
    </>
  );
}
