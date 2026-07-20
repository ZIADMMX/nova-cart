import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import connectToMongo from "@/lib/db";
import Notification from "@/model/Notfication";

const titleMap = {
    info: "إشعار جديد",
    success: "عملية ناجحة",
    warning: "تنبيه هام",
    error: "خطأ في النظام",
    order: "تحديث الطلب",
    product: "تحديث المنتج",
    alert: "تنبيه"
};

export async function GET(request) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بزيارة هذه الصفحة" }, { status: 401 });
        }

        await connectToMongo();

        const notifications = await Notification.find({ userId: auth.userId })
            .sort({ createdAt: -1 })
            .limit(50); // 🚨 حماية السيرفر: تحديد العدد بـ 50 إشعار لمنع الـ Memory Leak بسبب التحديث التلقائي (Polling)

        // إضافة عنوان (title) تلقائي بناءً على نوع الإشعار لمنع ظهور الحقل فارغاً في الواجهة
        const formattedNotifications = notifications.map(notif => {
            const obj = notif.toObject();
            return {
                ...obj,
                title: obj.title || titleMap[obj.type] || "إشعار جديد"
            };
        });

        return NextResponse.json(formattedNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 });
    }
}
