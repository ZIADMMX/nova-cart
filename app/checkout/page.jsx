"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { Loader2, ArrowRight, ShieldCheck, Truck, CreditCard, DollarSign } from "lucide-react";
import Image from "next/image";

// قائمة محافظات مصر للتسهيل والتنظيم
const EGYPT_GOVERNORATES = [
    "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", 
    "الشرقية", "المنوفية", "الغربية", "البحيرة", "دمياط", 
    "بورسعيد", "الإسماعيلية", "السويس", "كفر الشيخ", "الفيوم", 
    "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", 
    "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", 
    "شمال سيناء", "جنوب سيناء"
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
    
    // بيانات الشحن
    const [shippingForm, setShippingForm] = useState({
        fullName: "",
        phone: "",
        city: "",
        streetName: "",
        address: "",
        postalCode: ""
    });
    
    const [paymentMethod, setPaymentMethod] = useState("COD"); // COD أو Card
    const [errorMsg, setErrorMsg] = useState("");

    // حماية المسار
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/checkout");
        }
    }, [isAuthenticated, authLoading, router]);

    // جلب بيانات المنتجات المراد شراؤها
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
        if (productId) {
            return purchaseItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        }
        return cartTotal;
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        
        // التحقق من صحة المدخلات
        if (!shippingForm.fullName.trim()) return setErrorMsg("يرجى إدخال الاسم بالكامل");
        if (!shippingForm.phone.trim()) return setErrorMsg("يرجى إدخال رقم الهاتف");
        if (!/^01[0125][0-9]{8}$/.test(shippingForm.phone.trim())) {
            return setErrorMsg("يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)");
        }
        if (!shippingForm.city) return setErrorMsg("يرجى اختيار المحافظة");
        if (!shippingForm.streetName.trim()) return setErrorMsg("يرجى إدخال اسم الشارع");
        if (!shippingForm.address.trim()) return setErrorMsg("يرجى إدخال تفاصيل العنوان (عمارة/شقة)");

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
                    paymentMethod
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "حدث خطأ غير متوقع أثناء معالجة طلبك.");
            }

            if (data.url) {
                // إذا تم الدفع عند الاستلام أو نجحت جلسة الدفع
                if (paymentMethod === "COD") {
                    clearCart(); // تفريغ السلة بعد الدفع عند الاستلام الناجح
                }
                window.location.href = data.url;
            } else {
                throw new Error("لم يتم تلقي رابط المعالجة.");
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
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">جاري تحميل تفاصيل الطلب...</p>
            </div>
        );
    }

    const totalToPay = calculateTotal();

    if (purchaseItems.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full text-center">
                    <p className="text-slate-600 dark:text-slate-400 font-bold mb-6">سلتك فارغة أو لم تقم باختيار أي منتجات لشراءها.</p>
                    <button onClick={() => router.push("/products")} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
                        تصفح المنتجات
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
                    <ArrowRight className="w-4 h-4" /> العودة للتسوق
                </button>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-10">إتمام الشراء والدفع</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* فورم الشحن والدفع */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSubmitOrder} className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                    <Truck className="w-5 h-5 text-indigo-600" /> تفاصيل عنوان الشحن
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">يرجى إدخال بياناتك بشكل صحيح لضمان تسليم المنتج بأسرع وقت.</p>
                            </div>

                            {errorMsg && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الاسم بالكامل</label>
                                    <input 
                                        type="text" 
                                        name="fullName"
                                        placeholder="الاسم الثلاثي أو الثنائي"
                                        value={shippingForm.fullName}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">رقم الموبايل</label>
                                        <input 
                                            type="tel" 
                                            name="phone"
                                            placeholder="رقم الهاتف للتوصيل"
                                            value={shippingForm.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">المحافظة</label>
                                        <select 
                                            value={shippingForm.city}
                                            onChange={handleSelectCity}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        >
                                            <option value="">اختر المحافظة</option>
                                            {EGYPT_GOVERNORATES.map(gov => (
                                                <option key={gov} value={gov}>{gov}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">اسم الشارع</label>
                                        <input 
                                            type="text" 
                                            name="streetName"
                                            placeholder="مثال: شارع البطل أحمد عبد العزيز"
                                            value={shippingForm.streetName}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تفاصيل العنوان (عمارة / دور / شقة)</label>
                                        <input 
                                            type="text" 
                                            name="address"
                                            placeholder="مثال: عمارة 12، الدور الثالث، شقة 5"
                                            value={shippingForm.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* طريقة الدفع */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <CreditCard className="w-5 h-5 text-indigo-600" /> اختر طريقة الدفع
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
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">الدفع عند الاستلام</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">ادفع نقداً عند استلام المنتج</p>
                                        </div>
                                    </label>

                                    <label 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                            paymentMethod === "Card" 
                                            ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20" 
                                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="Card" 
                                            checked={paymentMethod === "Card"} 
                                            onChange={() => setPaymentMethod("Card")}
                                            className="hidden"
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">بطاقة ائتمان / فيزا</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">الدفع آمن ومحمي بالكامل</p>
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
                                        <span>جاري تأكيد وتسجيل الطلب...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>تأكيد وشراء الطلب بقيمة ${totalToPay.toFixed(2)}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* ملخص الطلب */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">ملخص طلبك</h2>

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
                                                <span className="text-xs text-slate-500 dark:text-slate-400">الكمية: {item.quantity}</span>
                                                <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">${item.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                                    <span>المجموع الفرعي</span>
                                    <span>${totalToPay.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                                    <span>مصاريف الشحن</span>
                                    <span className="text-green-600 dark:text-green-400">مجانًا</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span>المجموع الكلي</span>
                                    <span>${totalToPay.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex gap-4 items-start">
                            <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">تسوق آمن ومضمون 100%</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">نحن نضمن حماية جميع بياناتك المالية والشخصية باستخدام تشفير SSL المتقدم.</p>
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
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">جاري تحميل الصفحة...</p>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
