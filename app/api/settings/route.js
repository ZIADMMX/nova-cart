import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import SiteSettings from "@/model/SiteSettings";
import { getAuthFromCookie } from "@/lib/auth";

// GET - عام: يجلب الإعدادات لأي زائر (للاستخدام في الـ Footer)
export async function GET() {
    try {
        await connectToMongo();
        // findOne أو إنشاء سجل افتراضي إذا لم يكن موجوداً
        let settings = await SiteSettings.findOne({ singleton: "global" });
        if (!settings) {
            settings = { siteName: "NovaCart", siteDescription: "منصة تسوق متكاملة", logoUrl: "", faviconUrl: "", facebook: "", instagram: "", tiktok: "" };
        }
        return NextResponse.json({
            siteName: settings.siteName || "NovaCart",
            siteDescription: settings.siteDescription || "منصة تسوق متكاملة",
            logoUrl: settings.logoUrl || "",
            faviconUrl: settings.faviconUrl || "",
            facebook: settings.facebook || "",
            instagram: settings.instagram || "",
            tiktok: settings.tiktok || "",
        });
    } catch (error) {
        console.error("❌ خطأ في جلب الإعدادات:", error);
        return NextResponse.json({ facebook: "", instagram: "", tiktok: "" });
    }
}

// PUT - محمي: تحديث الإعدادات من قِبَل الأدمن فقط
export async function PUT(req) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || !["admin", "super_admin"].includes(auth.role)) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بتعديل الإعدادات" }, { status: 403 });
        }

        const { siteName, siteDescription, logoUrl, faviconUrl, facebook, instagram, tiktok } = await req.json();

        await connectToMongo();

        // upsert: تحديث إذا وُجد، أو إنشاء إذا لم يُوجد
        const settings = await SiteSettings.findOneAndUpdate(
            { singleton: "global" },
            { 
                siteName: siteName || "NovaCart",
                siteDescription: siteDescription || "",
                logoUrl: logoUrl || "",
                faviconUrl: faviconUrl || "",
                facebook: facebook || "", 
                instagram: instagram || "", 
                tiktok: tiktok || "" 
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("❌ خطأ في تحديث الإعدادات:", error);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 });
    }
}
