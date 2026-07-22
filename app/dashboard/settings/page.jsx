"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Settings, ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// أيقونة TikTok مخصصة لأنها غير موجودة في lucide-react
function TikTokIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}

function FacebookIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
    );
}

function InstagramIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.196a3.196 3.196 0 1 1 0-6.392 3.196 3.196 0 0 1 0 6.392zm5.23-6.9a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
        </svg>
    );
}

export default function SettingsPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        siteName: "",
        siteDescription: "",
        logoUrl: "",
        faviconUrl: "",
        facebook: "",
        instagram: "",
        tiktok: "",
    });

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!isAuthenticated) router.push("/auth/login");
            else if (!["admin", "super_admin"].includes(user?.role)) router.push("/");
        }
    }, [mounted, authLoading, isAuthenticated, user?.role, router]);

    useEffect(() => {
        if (mounted && !authLoading && ["admin", "super_admin"].includes(user?.role)) {
            fetchSettings();
        }
    }, [mounted, authLoading, user?.role]);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/settings");
            const data = await res.json();
            setFormData({
                siteName: data.siteName || "",
                siteDescription: data.siteDescription || "",
                logoUrl: data.logoUrl || "",
                faviconUrl: data.faviconUrl || "",
                facebook: data.facebook || "",
                instagram: data.instagram || "",
                tiktok: data.tiktok || "",
            });
        } catch (err) {
            setError("Failed to fetch Settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (field === "logo") setIsUploadingLogo(true);
        if (field === "favicon") setIsUploadingFavicon(true);
        setSuccess("");
        setError("");

        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: uploadData,
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    [field === "logo" ? "logoUrl" : "faviconUrl"]: data.url
                }));
                setSuccess(field === "logo" ? "Logo uploaded successfully! ✅" : "Favicon uploaded successfully! ✅");
                setTimeout(() => setSuccess(""), 4000);
            } else {
                setError(data.message || "Failed to upload file");
            }
        } catch (err) {
            setError("Error occurred while uploading file");
        } finally {
            if (field === "logo") setIsUploadingLogo(false);
            if (field === "favicon") setIsUploadingFavicon(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccess("");
        setError("");
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save");
            setSuccess("Settings saved successfully! ✅");
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    if (!["admin", "super_admin"].includes(user?.role)) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-8" dir="ltr">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                    <Link href="/dashboard" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 border border-slate-200/50 dark:border-slate-800">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-indigo-600" />
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white">Site Settings</h1>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium">Manage your store's social media links</p>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-sm text-rose-700 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-semibold">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <p className="font-semibold">{success}</p>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Social Media Links</h2>
                        <p className="text-xs text-slate-400 mt-0.5">These links will appear in the website footer for all visitors.</p>
                    </div>

                    {isLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="p-6 space-y-8">
                            
                            {/* Brand Identity Section */}
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Brand Identity</h3>
                                </div>
                                
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Site Name</label>
                                    <input
                                        type="text"
                                        value={formData.siteName}
                                        onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                                        placeholder="NovaCart"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Site Description (SEO)</label>
                                    <textarea
                                        value={formData.siteDescription}
                                        onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                                        placeholder="A brief description that appears in Google and when sharing the link..."
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* شعار الموقع */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">Site Logo</label>
                                        <div className="flex gap-3 items-center">
                                            {formData.logoUrl && (
                                                <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-950">
                                                    <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            )}
                                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {isUploadingLogo ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>Upload Logo</>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, "logo")}
                                                    className="hidden"
                                                    disabled={isUploadingLogo}
                                                />
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.logoUrl}
                                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                            placeholder="Or paste logo URL here..."
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white font-mono transition-all"
                                        />
                                    </div>

                                    {/* أيقونة المتصفح */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">Favicon</label>
                                        <div className="flex gap-3 items-center">
                                            {formData.faviconUrl && (
                                                <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-950">
                                                    <img src={formData.faviconUrl} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            )}
                                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {isUploadingFavicon ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>Upload Favicon</>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, "favicon")}
                                                    className="hidden"
                                                    disabled={isUploadingFavicon}
                                                />
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.faviconUrl}
                                            onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                                            placeholder="Or paste favicon URL here..."
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white font-mono transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Social Media Section */}
                            <div className="space-y-5 pt-4">
                                <div>
                                    <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Social Media Links</h3>
                                </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                    <FacebookIcon className="w-4 h-4 text-blue-500" />
                                    Facebook Page URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.facebook}
                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                    placeholder="https://facebook.com/yourpage"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white font-mono transition-all"
                                />
                            </div>

                            {/* Instagram */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                    <InstagramIcon className="w-4 h-4 text-pink-500" />
                                    Instagram Profile URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    placeholder="https://instagram.com/yourprofile"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white font-mono transition-all"
                                />
                            </div>

                            {/* TikTok */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                    <TikTokIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                    TikTok Profile URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.tiktok}
                                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                    placeholder="https://tiktok.com/@yourprofile"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white font-mono transition-all"
                                />
                            </div>

                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? "Saving..." : "Save Settings"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
