import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import connectToMongo from "@/lib/db";
import Notification from "@/model/Notfication"; // 🛠️ تم تصحيح الحروف الإملائية لاسم الملف والموديل هنا

export async function PUT(request, { params }) {
    try {
        // 1. استخراج الـ id القادم من الرابط الديناميكي
        const { id } = await params;
        
        // 2. التحقق من الهوية
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بزيارة هذه الصفحة" }, { status: 401 });
        }

        await connectToMongo();

        // 3. التحديث الآمن: نتحقق أن الإشعار يخص نفس المستخدم الحالي        
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: auth.userId },
            { isRead: true },
            { new: true } // لإرجاع البيانات الجديدة بعد التحديث مباشرة
        );

        // 4. التحقق من وجود الإشعار
        if (!notification) {
            return NextResponse.json({ success: false, message: "الإشعار غير موجود أو لا يخص هذا الحساب" }, { status: 404 });
        }

        // 5. إرجاع الرد بنجاح للـ Frontend ليعيد رندرة الأيقونات
        return NextResponse.json({ success: true, notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 });
    }
}
