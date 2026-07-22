"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // 🛠️ حل مشكلة الـ Hydration

  // 1. استرجاع بيانات السلة عند الLoading (مرة واحدة فقط)
  useEffect(() => {
    const savedCart = localStorage.getItem('novacart_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart data", e);
      }
    }
    setIsMounted(true); // تأكيد اكتمال الـ Mount في المتصفح بسNoم
  }, []);

  // 2. 🛠️ حل ثغرة مسح السلة عند الـ Mount: No نSave إNo بعد اكتمال الـ Mount الفعلي وتغير السلة
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('novacart_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  // 3. 🛡️ تأمين الإضافة مع فحص المخزن (Stock Validation)
  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      
      // الحصول على المخزن المتاح للمنتج (القيمة اNoفتراضية 99 لو الحقل Out of Stock)
      const maxStock = product.stock !== undefined ? product.stock : 99;

      if (existingItem) {
        // Prevent adding more than 1 for digital products
        if (product.productType === 'digital_file' || product.productType === 'license_key') {
          alert("Products الرقمية يمكن شراء قطعة واحدة منها فقط لكل طلب.");
          return prevCart;
        }

        const newQuantity = existingItem.quantity + quantity;
        
        // إذا تخطت Quantity الجديدة المخزون المتاح، نثبتها عند الحد الأقصى للمخزون وننبه العميل
        if (newQuantity > maxStock) {
          alert(`عذراً، المخزون المتاح من هذا المنتج هو ${maxStock} فقط!`);
          return prevCart.map((item) =>
            item._id === product._id ? { ...item, quantity: maxStock } : item
          );
        }

        return prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // فحص المخزون قبل الإضافة لأول مرة
      if (quantity > maxStock) {
        alert(`عذراً، المخزون المتاح من هذا المنتج هو ${maxStock} فقط!`);
        return [...prevCart, { ...product, quantity: maxStock }];
      }

      return [...prevCart, { ...product, quantity }];
    });
    
    setIsCartOpen(true); // فتح السلة الجانبية تلقائياً لتنبيه العميل بالمنتج الجديد
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  // 4. 🛡️ تأمين تحديث Quantity اليدوي مع فحص المخزن
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          if ((item.productType === 'digital_file' || item.productType === 'license_key') && quantity > 1) {
             alert("Products الرقمية يمكن شراء قطعة واحدة منها فقط لكل طلب.");
             return { ...item, quantity: 1 };
          }
          const maxStock = item.stock !== undefined ? item.stock : 99;
          if (quantity > maxStock) {
            alert(`نعتذر، No يمكنك تخطي المخزون المتاح (${maxStock} قطعة).`);
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // 🛠️ لمنع تضارب الـ HTML بداخل سيرفر Next.js حتى يكتمل الـ Mount تماماً في جهاز المستخدم
  if (!isMounted) {
    return null; 
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
