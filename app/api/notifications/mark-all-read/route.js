import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import connectToMongo from "@/lib/db";
import Notification from "@/model/Notfication";

export async function PUT(request) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بزيارة هذه الصفحة" }, { status: 401 });
        }

        await connectToMongo();

        await Notification.updateMany(
            { userId: auth.userId, isRead: false },
            { isRead: true }
        );

        return NextResponse.json({ success: true, message: "تم تحديد جميع الإشعارات كمقروءة" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 });
    }
}
