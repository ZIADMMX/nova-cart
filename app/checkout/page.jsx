"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { Loader2, ArrowRight, ShieldCheck, Truck, CreditCard, DollarSign } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/formatPrice";

// قائمة محافظات مصر للتسهيل والتنظيم
const EGYPT_GOVERNORATES = [
    "Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", 
    "Sharqia", "Monufia", "Gharbia", "Beheira", "Damietta", 
    "Port Said", "Ismailia", "Suez", "Kafr El Sheikh", "Faiyum", 
    "Beni Suef", "Minya", "Asyut", "Sohag", "Qena", 
    "Luxor", "Aswan", "Red Sea", "New Valley", "Matrouh", 
    "North Sinai", "South Sinai"
];

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { cart, cartTotal, clearCart } = useCart();
    
    const productId = searchParams.get("productId");
    
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // بيانات الShipping
    const [shippingForm, setShippingForm] = useState({
        fullName: "",
        phone: "",
        city: "",
        streetName: "",
        address: "",
        postalCode: ""
    });
    
    const [paymentMethod, setPaymentMethod] = useState("Stripe"); // COD أو Stripe
    const [errorMsg, setErrorMsg] = useState("");

    // Coupon states
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // حماية المسار
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/checkout");
        }
    }, [isAuthenticated, authLoading, router]);

    // جلب بيانات Products المراد شراؤها
    useEffect(() => {
        if (productId) {
            // شراء منتج واحد مباشرة
            setLoadingItems(true);
            fetch(`/api/products/${productId}`)
                .then(res => res.json())
                .then(data => {
                    const product = data.product || data;
                    if (product) {
                        setPurchaseItems([{
                            _id: product._id,
                            title: product.title,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            quantity: 1
                        }]);
                    }
                })
                .catch(err => console.error("Error fetching product:", err))
                .finally(() => setLoadingItems(false));
        } else {
            // شراء محتويات السلة بأكملها
            setPurchaseItems(cart.map(item => ({
                _id: item._id,
                title: item.title,
                price: item.price,
                imageUrl: item.imageUrl,
                quantity: item.quantity
            })));
        }
    }, [productId, cart]);

    const handleInputChange = (e) => {
        setShippingForm({
            ...shippingForm,
            [e.target.name]: e.target.value
        });
    };

    const handleSelectCity = (e) => {
        setShippingForm({
            ...shippingForm,
            city: e.target.value
        });
    };

    const calculateTotal = () => {
        let total = 0;
        if (productId) {
            total = purchaseItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        } else {
            total = cartTotal;
        }
        return total;
    };

    const getDiscountAmount = (total) => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'percentage') {
            return (total * appliedCoupon.value) / 100;
        } else if (appliedCoupon.type === 'fixed') {
            return appliedCoupon.value;
        }
        return 0; // free_shipping not affecting subtotal here
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplyingCoupon(true);
        setCouponError("");
        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    couponCode: couponCode.trim(),
                    orderAmount: calculateTotal()
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAppliedCoupon(data.coupon);
                setCouponError("");
            } else {
                setCouponError(data.error || "كوبون غير صالح");
                setAppliedCoupon(null);
            }
        } catch (error) {
            setCouponError("حدث خطأ أثناء التحقق من الكوبون");
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        
        // التحقق من صحة المدخNoت
        if (!shippingForm.fullName.trim()) return setErrorMsg("Please enter your full name");
        if (!shippingForm.phone.trim()) return setErrorMsg("Please enter your phone number");
        if (!/^01[0125][0-9]{8}$/.test(shippingForm.phone.trim())) {
            return setErrorMsg("Please enter a valid phone number (e.g., 01012345678)");
        }
        if (!shippingForm.city) return setErrorMsg("Please select a governorate");
        if (!shippingForm.streetName.trim()) return setErrorMsg("Please enter the street name");
        if (!shippingForm.address.trim()) return setErrorMsg("Please enter address details (building/apartment)");

        setSubmitting(true);

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: purchaseItems,
                    shippingAddress: shippingForm,
                    paymentMethod,
                    couponCode: appliedCoupon ? appliedCoupon.code : null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "An unexpected error occurred while processing your order.");
            }

            if (data.url) {
                // إذا تم Cash on Delivery أو نجحت جلسة Checkout
                if (paymentMethod === "COD") {
                    clearCart(); // تفريغ السلة بعد Cash on Delivery الناجح
                }
                window.location.href = data.url;
            } else {
                throw new Error("Processing link not received.");
            }

        } catch (error) {
            console.error("Order submission error:", error);
            setErrorMsg(error.message);
            setSubmitting(false);
        }
    };

    if (authLoading || loadingItems) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading Order Details...</p>
            </div>
        );
    }

    const subTotal = calculateTotal();
    const discountAmount = getDiscountAmount(subTotal);
    const totalToPay = Math.max(0, subTotal - discountAmount);

    if (purchaseItems.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full text-center">
                    <p className="text-slate-600 dark:text-slate-400 font-bold mb-6">Your cart is empty or you haven't selected any products to buy.</p>
                    <button onClick={() => router.push("/products")} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
                        Browse Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-20 pt-10 px-4 font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-8 transition-colors"
                >
                    <ArrowRight className="w-4 h-4" /> Back to Shopping
                </button>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-10">Checkout & Complete Purchase</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* فورم الShipping وCheckout */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSubmitOrder} className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                    <Truck className="w-5 h-5 text-indigo-600" /> Shipping Address Details
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Please enter your details correctly to ensure the fastest delivery.</p>
                            </div>

                            {errorMsg && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
                                    <input 
                                        type="text" 
                                        name="fullName"
                                        placeholder="Full Name (First and Last)"
                                        value={shippingForm.fullName}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Mobile Number</label>
                                        <input 
                                            type="tel" 
                                            name="phone"
                                            placeholder="Delivery Phone Number"
                                            value={shippingForm.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Governorate</label>
                                        <select 
                                            value={shippingForm.city}
                                            onChange={handleSelectCity}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        >
                                            <option value="">اختر Governorate</option>
                                            {EGYPT_GOVERNORATES.map(gov => (
                                                <option key={gov} value={gov}>{gov}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Street Name</label>
                                        <input 
                                            type="text" 
                                            name="streetName"
                                            placeholder="e.g., Main Street"
                                            value={shippingForm.streetName}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Address Details (Building / Floor / Apt)</label>
                                        <input 
                                            type="text" 
                                            name="address"
                                            placeholder="e.g., Building 12, Floor 3, Apt 5"
                                            value={shippingForm.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <CreditCard className="w-5 h-5 text-indigo-600" /> Select Payment Method
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                            paymentMethod === "COD" 
                                            ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20" 
                                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="COD" 
                                            checked={paymentMethod === "COD"} 
                                            onChange={() => setPaymentMethod("COD")}
                                            className="hidden"
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Cash on Delivery</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Pay in cash when you receive the product</p>
                                        </div>
                                    </label>

                                    <label 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                            paymentMethod === "Stripe" 
                                            ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20" 
                                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="Stripe" 
                                            checked={paymentMethod === "Stripe"} 
                                            onChange={() => setPaymentMethod("Stripe")}
                                            className="hidden"
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Stripe (Visa/Mastercard)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Secure checkout through Stripe payment gateway</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-base"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Confirming and placing order...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm and buy order for {formatPrice(totalToPay, "USD")}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* ملخص الطلب */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Order Summary</h2>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[300px] pr-2">
                                {purchaseItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                            {item.imageUrl ? (
                                                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="64px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Truck className="w-6 h-6 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Quantity: {item.quantity}</span>
                                                <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">{formatPrice(item.price, "EGP")}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Input Area */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Have a Coupon Code?</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        disabled={appliedCoupon !== null}
                                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold disabled:opacity-50"
                                    />
                                    {appliedCoupon ? (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setAppliedCoupon(null);
                                                setCouponCode("");
                                            }}
                                            className="px-4 py-3 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-xl transition-all text-sm"
                                        >
                                            إزالة
                                        </button>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={applyingCoupon || !couponCode.trim()}
                                            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50"
                                        >
                                            {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                        </button>
                                    )}
                                </div>
                                {couponError && (
                                    <p className="text-red-500 text-xs font-bold mt-1">{couponError}</p>
                                )}
                                {appliedCoupon && (
                                    <p className="text-green-500 text-xs font-bold mt-1">تم تطبيق الخصم بنجاح!</p>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subTotal, "USD")}</span>
                                </div>
                                
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400">
                                        <span>Discount ({appliedCoupon?.code})</span>
                                        <span>- {formatPrice(discountAmount, "USD")}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                                    <span>Shipping Fees</span>
                                    <span className="text-green-600 dark:text-green-400">
                                        {appliedCoupon?.type === 'free_shipping' ? 'Free (Coupon)' : 'Free'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span>Total</span>
                                    <span>{formatPrice(totalToPay, "USD")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex gap-4 items-start">
                            <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">100% Safe & Secure Shopping</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">We ensure the protection of all your financial and personal data using advanced SSL encryption.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading Page...</p>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
