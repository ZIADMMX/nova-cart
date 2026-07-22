"use client";

import { useEffect, useState } from "react";
// ⚠️ انتبه: لقد أعدت المسار إلى componant (بحرف a) لأن المجلد الفعلي في ملفات المشروع لديك اسمه هكذا. 
// إذا كان مكون AuthProviders No يعمل، فتأكد من تغيير اسم المجلد الفعلي لديك من componant إلى components أوNoً!
import { useAuth } from "@/components/providers/AuthProvider"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
    Package, Loader2, Plus, Trash2, Pencil, ArrowLeft, X, Check, AlertCircle, Save, ShoppingBag, Sparkles
} from "lucide-react"; // 🛠️ تنظيف اNoستيرادات وDelete التكرار والأسماء الخاطئة

export default function ProductsPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [productEditData, setProductEditData] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // States for pagination
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // 🛠️ تم Edit الحقل القياسي ليكون stock ليتطابق مع الـ Payload بالأسفل
    const [formData, setFormData] = useState({
        title: "",
        price: "",
        description: "",
        currency: "USD",
        category: "",
        imageUrl: "",
        stock: "",
        isActive: true,
        productType: "physical",
        downloadUrl: "",
        licenseKeysPool: ""
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!isAuthenticated) router.push("/auth/login");
            else if (user?.role !== "admin" && user?.role !== "super_admin") router.push("/");
        }
    }, [authLoading, user?.role, isAuthenticated, router, mounted]);

    useEffect(() => {
        if (mounted) {
            fetchProducts(page);
        }
    }, [mounted, page]);

    const fetchProducts = async (currentPage = page) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`/api/products/admin?page=${currentPage}&limit=${limit}`, {
                credentials: "include"
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) return;
                throw new Error("Failed to fetch products");
            }
            const data = await response.json();
            if (data.products) {
                setProducts(data.products);
                setPage(data.page);
                setPages(data.pages);
                setTotal(data.total);
            } else {
                setProducts(data);
                setPage(1);
                setPages(1);
                setTotal(data.length);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setProductEditData(null);
        setError(null);
    };

    const closeConfirmModal = () => {
        setDeleteConfirm(null);
    };

    const openModal = (product = null) => {
        if (product) {
            setProductEditData(product);
            setFormData({
                title: product.title || "",
                price: product.price?.toString() || "",
                description: product.description || "",
                currency: product.currency || "USD",
                category: product.category || "",
                imageUrl: product.imageUrl || "",
                stock: product.stock?.toString() || "0",
                isActive: product.isActive ?? true,
                productType: product.productType || "physical",
                downloadUrl: product.downloadUrl || "",
                licenseKeysPool: product.licenseKeysPool ? product.licenseKeysPool.join("\n") : ""
            });
        } else {
            setProductEditData(null);
            setFormData({
                title: "",
                price: "",
                description: "",
                currency: "USD",
                category: "",
                imageUrl: "",
                stock: "",
                isActive: true,
                productType: "physical",
                downloadUrl: "",
                licenseKeysPool: ""
            });
        }
        setError(null);
        setShowModal(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingImage(true);
        setError(null);

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
                    imageUrl: data.url
                }));
            } else {
                setError(data.message || "Failed to upload image");
            }
        } catch (err) {
            setError("Error uploading image");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleGenerateAIDescription = async () => {
        if (!formData.title) {
            setError("يرجى كتابة اسم المنتج أوNoً لتوليد الوصف");
            return;
        }
        
        setIsGeneratingAI(true);
        setError(null);
        
        try {
            const res = await fetch("/api/ai/generate-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    title: formData.title, 
                    category: formData.category 
                }),
            });
            
            const data = await res.json();
            
            if (res.ok && data.description) {
                setFormData(prev => ({ ...prev, description: data.description }));
            } else {
                setError(data.message || "فشل توليد الوصف بالذكاء اNoصطناعي");
            }
        } catch (err) {
            setError("Error occurred أثناء Connection بالذكاء اNoصطناعي");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock: formData.productType === 'license_key' 
                    ? (formData.licenseKeysPool ? formData.licenseKeysPool.split("\n").filter(k => k.trim()).length : 0)
                    : (formData.productType === 'digital_file' ? 999999 : parseInt(formData.stock, 10)),
                licenseKeysPool: formData.productType === 'license_key' && formData.licenseKeysPool 
                    ? formData.licenseKeysPool.split("\n").map(k => k.trim()).filter(k => k) 
                    : []
            };
            
            // 🛠️ تصحيح اسم متغير الEdit لـ productEditData المعرّف بالأعلى
            const url = productEditData ? `/api/products/${productEditData._id}` : "/api/products"; 

            const response = await fetch(url, {
                method: productEditData ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.message || "Failed to save product");
            }

            fetchProducts();
            closeModal(); // 🛠️ تصحيح اسم الدالة المستدعاة
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (productId) => {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.message || "Failed to delete product");
            }
            setProducts(products.filter((p) => p._id !== productId));
            closeConfirmModal();
        } catch (error) {
            setError(error.message);
            closeConfirmModal();
        }
    };

    if (!mounted || authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mr-2 animate-spin" />
                <div className="text-gray-600 dark:text-gray-400 font-medium">Loading products...</div>
            </div>
        );
    }

    if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-left" dir="ltr">
            <div className="max-w-7xl mx-auto mb-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-6 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Dashboard</span>
                </Link>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-xl font-black text-gray-900 dark:text-white font-sans">Manage Products</h1>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Add, edit, and manage your store's inventory</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
                
                {/* 3 Purposeful Stat Cards for Products */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-indigo-100 text-xs font-bold mb-1">Total Catalog</p>
                            <h3 className="text-2xl font-black">{total} <span className="text-sm font-medium text-indigo-200">Products</span></h3>
                        </div>
                        <Package className="w-10 h-10 text-white/30" />
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-emerald-50 text-xs font-bold mb-1">Active Products</p>
                            <h3 className="text-2xl font-black">{products.filter(p => p.isActive).length}</h3>
                        </div>
                        <Check className="w-10 h-10 text-white/30" />
                    </div>
                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
                        <div>
                            <p className="text-rose-50 text-xs font-bold mb-1">Out of Stock</p>
                            <h3 className="text-2xl font-black">{products.filter(p => p.stock === 0).length}</h3>
                        </div>
                        <AlertCircle className="w-10 h-10 text-white/30" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-4">
                {error && !showModal && (
                    <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 p-4 flex items-center gap-3 rounded-xl mb-6">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                        <p className="text-red-700 dark:text-red-300 font-medium text-sm flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-md mx-auto">
                        <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mb-5">Get started by adding your first product to the inventory.</p>
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Product
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Stock</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs font-medium">
                                    {products.map((product) => (
                                        <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 relative bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800 overflow-hidden shrink-0">
                                                        {product.imageUrl ? (
                                                            <Image src={product.imageUrl} alt={product.title} fill sizes="40px" className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-900 dark:text-white font-bold block truncate max-w-[180px]" title={product.title}>
                                                            {product.title}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            ID: {product._id?.slice(-6).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    {product.category || "General"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">
                                                {product.currency === "USD" ? "$" : product.currency} {product.price?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    product.stock > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/25 dark:text-green-400" :
                                                    product.stock > 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/25 dark:text-yellow-400" :
                                                    "bg-red-100 text-red-700 dark:bg-red-900/25 dark:text-red-400"
                                                }`}>
                                                    {product.stock > 0 ? `${product.stock} Units` : "Out of Stock"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    product.isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${product.isActive ? "bg-indigo-500" : "bg-gray-400"}`}></span>
                                                    {product.isActive ? "Active" : "Draft"}
                                                </span>
                                            </td>
                                            {/* 🛠️ تم إزالة عمود تاريخ إنشاء المنتج الزائد لموازنة خNoيا الـ Table */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button onClick={() => openModal(product)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    {deleteConfirm === product._id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleDelete(product._id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setDeleteConfirm(product._id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors cursor-pointer">
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        {pages > 1 && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{" "}
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {Math.min(page * limit, total)}
                                    </span>{" "}
                                    of <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> products
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <div className="hidden sm:flex items-center gap-1 font-bold text-xs">
                                        {Array.from({ length: pages }, (_, i) => i + 1).map((pNum) => (
                                            <button
                                                key={pNum}
                                                onClick={() => setPage(pNum)}
                                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                                    page === pNum
                                                        ? "bg-indigo-600 border-indigo-600 text-white font-black"
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                {pNum}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="sm:hidden text-xs font-bold text-slate-600 dark:text-slate-400">
                                        Page {page} of {pages}
                                    </div>
                                    <button
                                        onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                                        disabled={page === pages}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* النافذة المنبثقة لAdd وEdit Products */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 rounded-t-2xl">
                            <h3 className="text-base font-black text-gray-900 dark:text-white">
                                {productEditData ? "Update Product Details" : "Create New Product"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 rounded-xl dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 text-red-700 dark:text-red-400 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p className="font-medium">{error}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Product Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Description</label>
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateAIDescription}
                                            disabled={isGeneratingAI || !formData.title}
                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Generate AI Description
                                        </button>
                                    </div>
                                    <textarea
                                        value={formData.description}
                                        rows={4}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Product Type</label>
                                        <select
                                            value={formData.productType}
                                            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none text-gray-900 dark:text-white cursor-pointer font-medium"
                                        >
                                            <option value="physical">Physical Product</option>
                                            <option value="digital_file">Digital File</option>
                                            <option value="license_key">License Key(s)</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.productType === 'physical' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Stock Quantity</label>
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            required={formData.productType === 'physical'}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                )}

                                {formData.productType === 'digital_file' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Download URL (Secure Link)</label>
                                        <input
                                            type="url"
                                            value={formData.downloadUrl}
                                            onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                                            placeholder="https://example.com/file.zip"
                                            required={formData.productType === 'digital_file'}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Customers will download this file after purchase.</p>
                                    </div>
                                )}

                                {formData.productType === 'license_key' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">License Keys (One per line)</label>
                                        <textarea
                                            value={formData.licenseKeysPool}
                                            onChange={(e) => setFormData({ ...formData, licenseKeysPool: e.target.value })}
                                            placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY"
                                            rows={4}
                                            required={formData.productType === 'license_key'}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white font-mono"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Stock will be automatically calculated based on the number of keys.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g. Electronics"
                                            required
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Currency</label>
                                        {/* 🛠️ تم إغNoق الـ select بشكل قياسي صحيح ليعمل الفلتر */}
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none text-gray-900 dark:text-white cursor-pointer font-medium"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EGP">EGP (ج.م)</option>
                                            <option value="SAR">SAR (ر.س)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Product Image</label>
                                    <div className="flex gap-3 items-center">
                                        {formData.imageUrl && (
                                            <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-950">
                                                <img src={formData.imageUrl} alt="Product Preview" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all text-xs font-bold text-slate-600 dark:text-slate-400">
                                            {isUploadingImage ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>Upload Image</>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={isUploadingImage}
                                            />
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="Or paste image URL here..."
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white font-mono"
                                    />
                                </div>

                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-gray-300 cursor-pointer"
                                    />
                                    <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">Make product active and visible in catalog</label>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex items-center justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold rounded-xl px-4 py-3 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="productForm"
                                disabled={isSaving}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 py-3 transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {productEditData ? "Update Product" : "Create Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
