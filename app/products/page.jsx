"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Loader2, Package, ShoppingCart, ArrowRight, Search, Zap, Star } from "lucide-react";

export default function ProductPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [maxPrice, setMaxPrice] = useState(10000);
    const [siteSettings, setSiteSettings] = useState({ siteName: "" });

    const categories = ['All', 'الإلكترونيات', 'الملابس والأزياء', 'المنزل والمطبخ', 'العطور والتجميل'];

    useEffect(() => {
        fetchProducts();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSiteSettings(data);
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    useEffect(() => {
        let filtered = products;
        
        if (activeCategory !== 'All') {
            filtered = filtered.filter(p => p.category?.includes(activeCategory) || p.category === activeCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(product => 
                (product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        if (maxPrice < 10000) {
            filtered = filtered.filter(p => p.price <= maxPrice);
        }

        setFilteredProducts(filtered);
    }, [searchQuery, products, activeCategory, maxPrice]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch products');
            }

            setProducts(data.products || data); 
            setFilteredProducts(data.products || data);
        } catch (err) {
            setError(true);
            setErrorMessage('حدث خطأ أثناء جلب المنتجات');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 absolute" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">جاري تحميل أحدث المنتجات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800/30 text-center">
                    <p className="text-red-500 dark:text-red-400 font-bold">{errorMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-16 pt-8 font-sans" dir="rtl">
            {/* Premium Banner */}
            <div className="max-w-7xl mx-auto px-4 mb-12">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 opacity-90"></div>
                    {/* Animated background shapes */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full mix-blend-overlay animate-pulse"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 blur-3xl rounded-full mix-blend-overlay"></div>
                    
                    <div className="relative p-12 md:p-16 flex flex-col md:flex-row items-center justify-between z-10 text-center md:text-right gap-8">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold mb-4 shadow-xl">
                                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                التشكيلة الجديدة كلياً
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                                تسوق بذكاء، وانطلق <br className="hidden md:block"/> مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">{siteSettings.siteName || "NovaCart"}</span>
                            </h1>
                            <p className="text-indigo-100 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                                اكتشف تشكيلتنا الحصرية من المنتجات التي تناسب ذوقك. تسوق الآن واستمتع بتجربة فريدة وخصومات لا تعوض.
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-4">
                            {products.slice(0, 2).map((p, i) => (
                                <div key={i} className="w-32 h-32 relative rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300 bg-white/10 backdrop-blur-sm">
                                    {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="128px" className="w-full h-full object-cover opacity-90 hover:opacity-100" /> : <Package className="w-full h-full p-8 text-white/50" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Search Bar */}
            <div className="max-w-7xl mx-auto px-4 mb-10"> 
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 w-full md:w-1/2 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-transparent focus-within:border-indigo-500/30 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                        <Search className="w-5 h-5 text-indigo-500 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="ابحث عن أحدث الإلكترونيات، الملابس، والعروض..." 
                            className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
                        اكتشفنا لك: <span className="text-indigo-600 dark:text-indigo-400 text-base mx-1">{filteredProducts.length}</span> منتج مميز
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Modern Sidebar */}
                <aside className="lg:col-span-1 space-y-4">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50 sticky top-24">
                        <div className="mb-8">
                            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                تصفية بالسعر
                            </h2>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>$0</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">${maxPrice >= 10000 ? "10000+" : maxPrice}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="10000" 
                                    step="50"
                                    value={maxPrice} 
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <h2 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-indigo-500" />
                            الأقسام الرئيسية
                        </h2>
                        <ul className="space-y-1.5 text-sm font-medium">
                            {categories.map(cat => (
                                <li 
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                                        activeCategory === cat 
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                                        : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    }`}
                                >
                                    {cat === 'All' ? 'كل المنتجات' : cat}
                                    {activeCategory === cat && <ArrowRight className="w-4 h-4 opacity-70" />}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="lg:col-span-4">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Package className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">لا توجد منتجات</h3>
                            <p className="text-sm text-slate-500">حاول البحث بكلمات مختلفة أو تصفح الأقسام الأخرى.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product._id} product={product} /> 
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
} 

// Premium Product Card
function ProductCard({ product }) {
    return (
        <Link href={`/products/${product._id || product.id}`} className="group relative bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden isolate">
            {/* Image Container with Overlay */}
            <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                )}
                
                {/* Beautiful Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm py-2.5 rounded-xl text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        عرض التفاصيل
                    </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">
                    {product.category || "عام"}
                </div>
            </div>
            
            {/* Product Info */}
            <div className="p-5 flex flex-col flex-1 bg-white dark:bg-gray-900">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {product.title}
                    </h3>
                    <div className="flex items-center text-yellow-500 gap-0.5 text-xs font-bold bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        <span>{product.rating ? product.rating.toFixed(1) : "0.0"}</span>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 flex-1">
                    {product.description}
                </p>
                
                <div className="flex items-end justify-between mt-auto">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">السعر</p>
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            ${product.price}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 -rotate-45" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
