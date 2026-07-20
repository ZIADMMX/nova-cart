"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider"; 
import { Send, Bot, User, Loader2, Package, ArrowLeft } from "lucide-react";

export default function ChatPage() {
    const { isAuthenticated, loading: isLoadingAuth } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false); // 🎯 إضافة حالة الـ mounted هنا بأمان
    const [messages, setMessages] = useState([
        { role: "assistant", content: "مرحباً بك! أنا مساعدك الذكي لمتجر NovaCart. كيف يمكنني مساعدتك اليوم؟", products: [] },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messageEndRef = useRef(null);

    // 1. تفعيل الـ mounted بعد أول رندرة على العميل لمنع مشاكل الـ Hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. حماية المسار وتوجيه المستخدم غير المسجل
    useEffect(() => {
        if (mounted && !isAuthenticated && !isLoadingAuth) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, isLoadingAuth, router, mounted]);

    // 3. النزول التلقائي لأسفل الشات
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || isLoadingAuth) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMessage, products: [] }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: userMessage }),
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Failed to fetch data");
            }
            const data = await res.json();
            
            setMessages((prev) => [
                ...prev,
                { 
                    role: "assistant", 
                    content: data.reply || "أسف، لا أستطيع تنفيذ هذا الطلب حالياً.", 
                    products: data.products || [] 
                }
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.", products: [] }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // شاشة التحميل الأولية للمكون بالكامل لمنع مشاكل عدم تطابق السيرفر والعميل
    if (!mounted || isLoadingAuth) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-gray-950">
                <Loader2 className="animate-spin w-10 h-10 text-indigo-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">جارٍ التحميل...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white">المساعد الذكي</h1>
                            <p className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                                نشط الآن ...
                            </p>
                        </div>
                    </div>
                    <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        العودة للرئيسية
                    </Link>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                                msg.role === "user" 
                                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" 
                                    : "bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                            }`}>
                                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>

                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                                msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 rounded-tl-none"
                            }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                {msg.products && msg.products.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                            <Package className="w-3.5 h-3.5" />
                                            المنتجات المقترحة:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {msg.products.map((prod, pIdx) => (
                                                <div key={pIdx} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
                                                    {(prod.imageUrl || prod.image) && (
                                                        <div className="w-10 h-10 relative shrink-0 overflow-hidden rounded-md bg-white dark:bg-gray-900">
                                                            <Image 
                                                                src={prod.imageUrl || prod.image} 
                                                                alt={prod.name || prod.title} 
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover" 
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prod.name || prod.title}</h4>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{prod.price} {prod.currency || "ر.س"}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 animate-spin" />
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messageEndRef} />
                </div>
            </div>

            {/* Input Bar */}
            <div className="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 shadow-md">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
                        placeholder="اكتب استفسارك هنا..."
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/10 cursor-pointer" 
                    >
                        <Send className="w-5 h-5 rotate-180" />
                    </button>
                </form>
            </div>
        </div>
    );
}
