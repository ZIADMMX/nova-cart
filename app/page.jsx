import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/UI/product";
import { HeroAuthButton, CtaAuthButton } from "@/components/UI/StorefrontAuthButtons";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import SiteSettings from "@/model/SiteSettings";
import {
    ShoppingBag,
    ArrowRight,
    Shield,
    Zap,
    Lock,
    CheckCircle,
    Package,
    CreditCard,
    Headphones,
    Sparkles,
} from "lucide-react";
import Script from "next/script";
import { formatPrice } from "@/lib/formatPrice";

// --- Server Data Fetching ---
async function getStoreData() {
    try {
        await connectToMongo();
        
        // Fetch featured products (limit to 4 as in original design)
        const productsRaw = await Product.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();
            
        // Fetch site settings
        const settingsRaw = await SiteSettings.findOne({ singleton: "global" }).lean();
        
        return {
            products: productsRaw.map(p => ({
                ...p,
                _id: p._id.toString(),
                createdAt: p.createdAt?.toISOString(),
                updatedAt: p.updatedAt?.toISOString()
            })),
            siteSettings: settingsRaw ? {
                ...settingsRaw,
                _id: settingsRaw._id.toString()
            } : { siteName: "", siteDescription: "", logoUrl: "", facebook: "", instagram: "", tiktok: "" }
        };
    } catch (error) {
        console.error("Failed to fetch store data:", error);
        return { products: [], siteSettings: { siteName: "", siteDescription: "", logoUrl: "", facebook: "", instagram: "", tiktok: "" } };
    }
}

export default async function Home() {
    const { products, siteSettings } = await getStoreData();

    // SEO Data
    const siteName = siteSettings.siteName || "NovaCart";
    const siteDescription = siteSettings.siteDescription || "Discover a world of premium craftsmanship and cutting-edge innovation. Hand-picked products curated specifically to elevate your modern lifestyle.";
    
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "description": siteDescription,
        "url": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/products?search={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <Script
                id="json-ld-website"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        {/* Left Content */}
                        <div className="order-2 lg:order-1 flex flex-col items-start text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium mb-6 text-xs sm:text-sm tracking-wide">
                                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                                <span>INTRODUCING VERSION 2.0</span>
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
                                Curated Selection,{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                    delivered instantly
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg text-slate-400 mb-8 leading-relaxed max-w-lg">
                                Discover a world of premium craftsmanship and cutting-edge innovation. Hand-picked products curated specifically to elevate your modern lifestyle.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-700 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 group"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Browse Products
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                
                                <HeroAuthButton />
                            </div>

                            <div className="flex items-center gap-6 mt-10 pt-6 border-t border-slate-900 w-full">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-slate-400 font-medium hover:text-white transition-colors duration-300 cursor-pointer">Verified products</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm text-slate-400 font-medium hover:text-white transition-colors duration-300 cursor-pointer">Secure checkout</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Content */}
                        <div className="order-1 lg:order-2 flex flex-col items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none scale-90" />
                            
                            <div className="relative w-full max-w-sm sm:max-w-md aspect-square">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full p-[2px] shadow-2xl shadow-indigo-500/10">
                                    <div className="relative w-full h-full overflow-hidden bg-slate-950 rounded-full border border-slate-900 flex items-center justify-center">
                                        <Image 
                                            src="/gaming_pc.png" 
                                            alt="High performance gaming computer" 
                                            fill
                                            className="object-cover opacity-90 transition-transform duration-700 hover:scale-105" 
                                        />
                                        <div className="absolute top-20 left-11 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl p-3 flex items-center justify-center transition-transform hover:scale-110 duration-300">
                                            <Package className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="absolute bottom-20 right-11 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl p-3 flex items-center justify-center transition-transform hover:scale-110 duration-300">
                                            <CreditCard className="w-5 h-5 text-purple-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl px-5 py-4 w-full max-w-sm sm:max-w-md shadow-xl flex items-center gap-4 transition-all hover:border-slate-700">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                                    <Shield className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-semibold text-white">
                                        Trusted <span className="text-indigo-400 font-bold">Payment Gateways</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">100% Encrypted & Protected Transactions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Why Choose Us Section */}
            <section className="py-20 lg:py-24 bg-slate-900/30 border-y border-slate-900 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                            Why Customers Choose Us
                        </h2>
                        <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                            We pride ourselves on offering a seamless shopping experience backed by industry-leading security and speed.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {[
                            { icon: <CreditCard className="w-6 h-6 text-indigo-400" />, title: "Secure Payments", description: "Every checkout transaction is processed securely through trusted payment providers." },
                            { icon: <Zap className="w-6 h-6 text-amber-400" />, title: "Instant Delivery", description: "Gain access to your purchases and shipping updates instantly without delay." },
                            { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: "Quality Guarantee", description: "All products are sourced directly from verified manufacturers for authenticity." },
                            { icon: <Headphones className="w-6 h-6 text-purple-400" />, title: "24/7 Dedicated Support", description: "Our team of customer support experts is always here to assist with any queries." },
                        ].map((item, index) => (
                            <div 
                                key={index} 
                                className="flex flex-col items-start gap-4 p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all duration-300 group cursor-pointer"
                            >
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 group-hover:text-white group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all duration-300">
                                    {item.icon}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white text-base mb-2 group-hover:text-indigo-400 transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
                        <div className="text-left">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                                Featured Products
                            </h2>
                            <p className="text-base text-slate-400 max-w-lg leading-relaxed">
                                Upgrade your lifestyle. Browse through the most-loved essentials handpicked by the Novacart community.
                            </p>
                        </div>
                        
                        <Link 
                            href="/products" 
                            className="group inline-flex items-center gap-2 font-bold text-indigo-400 hover:text-indigo-300 transition-colors duration-300 self-start sm:self-auto"
                        >
                            <span>View All Products</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {products.length > 0 ? (
                        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div> 
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-slate-900/20 border border-slate-900 w-full px-4">
                            <Package className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-300 mb-1">No products found</h3>
                            <p className="text-sm text-slate-500 text-center max-w-xs">Our product catalog is empty at the moment. Please check back later.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 lg:py-28 overflow-hidden border-t border-slate-900">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-8 sm:p-12 lg:p-16 text-center shadow-2xl">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="relative max-w-2xl mx-auto flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" />
                                Special Offer &amp; Updates
                            </div>
                            
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                                Ready to Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Shopping?</span>
                            </h2>
                            
                            <p className="text-base text-slate-400 mb-8 leading-relaxed">
                                Explore our curated collection of premium products. Create an account today for personalized recommendations, faster checkouts, and exclusive member-only deals.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                                <Link 
                                    href="/products" 
                                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-slate-950 hover:bg-slate-100 duration-300 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-white/5 group"
                                >
                                    Explore Products
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                
                                <CtaAuthButton />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8 mt-12 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 mb-12">
                        {/* Brand */}
                        <div className="col-span-1 text-left">
                            <Link href="/" className="flex items-center gap-2 mb-4 group">
                                {siteSettings.logoUrl ? (
                                    <img src={siteSettings.logoUrl} alt={siteSettings.siteName} className="h-10 w-auto object-contain rounded" />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
                                        <ShoppingBag className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <span className="text-xl font-bold text-white tracking-tight">
                                    {siteSettings.siteName || "NovaCart"}
                                </span>
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                {siteSettings.siteDescription || "Elevate your shopping experience. Discover curated, premium products delivered with unparalleled speed and reliability."}
                            </p>
                            {/* روابط التواصل اNoجتماعي - تُحدَّث من Dashboard */}
                            <div className="flex items-center gap-3">
                                {siteSettings.facebook && (
                                    <a href={siteSettings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                                        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 hover:-translate-y-0.5">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                )}
                                {siteSettings.instagram && (
                                    <a href={siteSettings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                                        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-300 hover:-translate-y-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                        </svg>
                                    </a>
                                )}
                                {siteSettings.tiktok && (
                                    <a href={siteSettings.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                                        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 hover:-translate-y-0.5">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                    </a>
                                )}
                                {!siteSettings.facebook && !siteSettings.instagram && !siteSettings.tiktok && (
                                    <p className="text-xs text-slate-600 italic">Follow us on social media.</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="text-left">
                            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Quick Links</h3>
                            <ul className="space-y-4">
                                <li><Link href="/products" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" /> All Products</Link></li>
                                <li><Link href="/orders" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" /> My Orders</Link></li>
                                <li><Link href="/notifications" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" /> Notifications</Link></li>
                                <li><Link href="/profile" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" /> My Profile</Link></li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="text-left">
                            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Stay In Touch</h3>
                            <p className="text-sm text-slate-400 mb-4 leading-relaxed">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
                            <form className="relative" action="#">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-3.5 pr-28 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                                />
                                <button 
                                    type="button"
                                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-500">
                            &copy; {new Date().getFullYear()} {siteSettings.siteName || "NovaCart"}. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/auth/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Login</Link>
                            <Link href="/auth/register" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Register</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
