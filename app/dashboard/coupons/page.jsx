"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Edit, Ticket, Check, X, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function CouponsDashboard() {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    const [coupons, setCoupons] = useState([]);
    const [fetching, setFetching] = useState(true);
    
    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        type: "percentage",
        value: "",
        expiryDate: "",
        usageLimit: "",
        minOrderAmount: "0",
        isActive: true
    });

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || !['admin', 'super_admin'].includes(user?.role)) {
                router.push("/");
                return;
            }
            fetchCoupons();
        }
    }, [loading, isAuthenticated, user, router]);

    const fetchCoupons = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/coupons");
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            } else {
                toast.error("Failed to load coupons");
            }
        } catch (error) {
            toast.error("An error occurred while loading coupons");
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const res = await fetch("/api/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    code: formData.code.toUpperCase()
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                toast.success("Coupon created successfully!");
                setIsModalOpen(false);
                setFormData({
                    code: "", type: "percentage", value: "", expiryDate: "", 
                    usageLimit: "", minOrderAmount: "0", isActive: true
                });
                fetchCoupons();
            } else {
                toast.error(data.message || "Failed to create coupon");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        
        try {
            const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Coupon deleted successfully");
                fetchCoupons();
            } else {
                toast.error("Failed to delete coupon");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        }
    };

    const toggleStatus = async (coupon) => {
        try {
            const res = await fetch(`/api/coupons/${coupon._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            if (res.ok) {
                toast.success(`Coupon ${coupon.isActive ? 'disabled' : 'enabled'}`);
                fetchCoupons();
            }
        } catch (error) {
            toast.error("Error updating coupon");
        }
    };

    if (loading || fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-indigo-600" />
                        Coupons & Discounts
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage promotional codes, discounts, and customer savings.
                    </p>
                </div>
                
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add New Coupon
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Type / Value</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Min. Order</th>
                                <th className="px-6 py-4">Expiry Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        No coupons found. Add your first coupon!
                                    </td>
                                </tr>
                            ) : (
                                coupons.map(coupon => (
                                    <tr key={coupon._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                                            {coupon.code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                {coupon.type === 'percentage' ? `${coupon.value}% Off` : 
                                                 coupon.type === 'fixed' ? `$${coupon.value} Off` : 
                                                 'Free Shipping'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                            {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ' / ∞'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                            {coupon.minOrderAmount > 0 ? `$${coupon.minOrderAmount}` : 'None'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                            {new Date(coupon.expiryDate).toLocaleDateString('en-US')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus(coupon)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                                    coupon.isActive 
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                {coupon.isActive ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleDelete(coupon._id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Add Coupon */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Add Discount Coupon</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Coupon Code (e.g. SAVE20)</label>
                                <input 
                                    type="text" 
                                    name="code"
                                    required
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:text-white uppercase font-black tracking-widest"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Discount Type</label>
                                    <select 
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:text-white font-medium"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                        <option value="free_shipping">Free Shipping</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Value</label>
                                    <input 
                                        type="number" 
                                        name="value"
                                        required={formData.type !== 'free_shipping'}
                                        min="0"
                                        disabled={formData.type === 'free_shipping'}
                                        value={formData.type === 'free_shipping' ? '0' : formData.value}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:text-white disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        name="expiryDate"
                                        required
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:text-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Usage Limit (Optional)</label>
                                    <input 
                                        type="number" 
                                        name="usageLimit"
                                        min="1"
                                        placeholder="Unlimited"
                                        value={formData.usageLimit}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:text-white"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Min. Order Amount ($)</label>
                                <input 
                                    type="number" 
                                    name="minOrderAmount"
                                    min="0"
                                    value={formData.minOrderAmount}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:text-white"
                                />
                            </div>
                            
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <input 
                                    type="checkbox" 
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Coupon is active and ready for use</span>
                            </label>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="flex-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[150px]"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Coupon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
