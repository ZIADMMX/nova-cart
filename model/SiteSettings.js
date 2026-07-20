import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema({
    // رابط فريد لضمان وجود سجل واحد فقط في قاعدة البيانات
    singleton: { type: String, default: "global", unique: true },

    // بيانات هوية الموقع (Dynamic Branding)
    siteName: { type: String, default: "NovaCart" },
    siteDescription: { type: String, default: "منصة تسوق متكاملة تضمن لك أفضل المنتجات بأفضل الأسعار." },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },

    // روابط التواصل الاجتماعي
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    tiktok: { type: String, default: "" },

}, { timestamps: true });

const SiteSettings = mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);

export default SiteSettings;
