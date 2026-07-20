"use client"

import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useCart } from "@/components/providers/CartProvider";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
    Menu,
    X,
    ShoppingBag,
    ShoppingCart,
    User,
    LogOut,
    LayoutDashboard,
    Bell,
    MessageCircle,
    Package,
    Moon,
    Sun,
} from "lucide-react";


export default function Navbar() {
    const { user, logout, isAuthenticated, loading } = useAuth()
    const { theme, toggleTheme } = useTheme();
    const { cartItemCount, setIsCartOpen } = useCart();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [siteSettings, setSiteSettings] = useState({ siteName: "NovaCart", logoUrl: "" });

    useEffect(() => {
        setMounted(true);
        // جلب إعدادات هوية الموقع الديناميكية
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    setSiteSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (mounted && isAuthenticated) {
            const fetchNotifications = async () => {
                try {
                    const res = await fetch("/api/notifications");
                    if (res.ok) {
                        const data = await res.json();
                        const unread = data.filter(n => !n.isRead).length;
                        setUnreadCount(unread);
                    }
                } catch (error) {
                    console.error("Failed to fetch notifications:", error);
                }
            };
            fetchNotifications();
            // Polling every 30 seconds for new notifications
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [mounted, isAuthenticated]);

    //logout function 
    const handleLogout = async () => {
        await logout()
        window.location.href = "/"
    };


    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/80 shadow-sm border-b backdrop-blur-xl border-gray-200/80 dark:bg-gray-900/80 dark:border-gray-800
            dark:text-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* logo (Dynamic Branding) */}
                        <Link href="/" className="flex items-center gap-2">
                            {siteSettings.logoUrl ? (
                                <img src={siteSettings.logoUrl} alt={siteSettings.siteName} className="h-8 w-auto object-contain rounded" />
                            ) : (
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <span className="font-bold text-xl text-gray-800 dark:text-white hover:text-indigo-600 transition-colors">
                                {siteSettings.siteName || "NovaCart"}
                            </span>
                        </Link>

                        {/* desktop navbar */}
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                Home
                            </Link>

                            {/* Theme Toggle Button (Desktop) */}
                            {mounted && (
                                <button 
                                    onClick={toggleTheme} 
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                    aria-label="Toggle Dark Mode"
                                >
                                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                                </button>
                            )}

                            {/* Cart Toggle Button (Desktop) */}
                            {mounted && (
                                <button 
                                    onClick={() => setIsCartOpen(true)} 
                                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                    aria-label="Open Cart"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {loading ? (
                                <div className="flex items-center gap-4 animate-pulse">
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                </div>
                            ) : isAuthenticated ? (
                                <div className="flex items-center gap-4">
                                    <Link href="/orders" className="hover:text-gray-600 dark:hover:text-white flex items-center gap-2">
                                        Orders
                                        <ShoppingBag className="w-5 h-5 cursor-pointer" />
                                    </Link>
                                    <Link href="/notifications" className="hover:text-gray-600 dark:hover:text-white flex items-center gap-2 relative">
                                        Notifications
                                        <div className="relative">
                                            <Bell className="w-5 h-5 cursor-pointer" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full border-2 border-white dark:border-gray-900">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    {(user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "super_admin") && (
                                        <Link href="/dashboard" className="hover:text-gray-600 dark:hover:text-white flex items-center gap-2" onClick={() => {
                                            setIsMobileMenuOpen(false)
                                        }}>
                                            Admin Dashboard
                                            <LayoutDashboard className="w-4 h-4 cursor-pointer" />
                                        </Link>
                                    )}

                                    <Link href="/profile" className="hover:text-indigo-600 flex items-center gap-2 font-medium transition-colors">
                                        <User className="w-5 h-5" />
                                        {user?.name || "Profile"}
                                    </Link>
                                    <button onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }} className="hover:text-red-600 flex items-center gap-2 px-2 py-1 rounded-full">
                                        <LogOut className="w-5 h-5 cursor-pointer" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                        Login
                                    </Link>
                                    <Link href="/auth/register" className="bg-indigo-500 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 transition-colors">
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center gap-2 ml-auto">
                            {/* Theme Toggle Button (Mobile) */}
                            {mounted && (
                                <button 
                                    onClick={toggleTheme} 
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                >
                                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                                </button>
                            )}

                            {/* Cart Toggle Button (Mobile) */}
                            {mounted && (
                                <button 
                                    onClick={() => setIsCartOpen(true)} 
                                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
                        <div className="flex flex-col items-center space-y-4">
                            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                Home
                            </Link>
                            {isAuthenticated ? (
                                <>
                                    <Link href="/orders" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        Orders
                                    </Link>
                                    <Link href="/notifications" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
                                        Notifications
                                        <div className="relative">
                                            <Bell className="w-4 h-4" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    {(user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "super_admin") && (
                                        <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                            Dashboard
                                        </Link>
                                    )}
                                    <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        Profile
                                    </Link>
                                    <button onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:text-red-600">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        Login
                                    </Link>
                                    <Link href="/auth/register" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}
