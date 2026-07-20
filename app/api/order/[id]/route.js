import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import Order from "@/model/Order";
import connectToMongo from "@/lib/db";

export async function PUT(request, { params }) {
    try {
        // 1. التحقق من الصلاحيات (أدمن فقط)
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك للقيام بهذا الإجراء" }, { status: 403 });
        }

        // 2. استقبال المعرف وحالة الطلب الجديدة
        const { id } = await params;
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ success: false, message: "الحالة الجديدة مطلوبة" }, { status: 400 });
        }

        // 3. الاتصال بقاعدة البيانات
        await connectToMongo();

        // 4. تحديث حالة الطلب
        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true } // إرجاع المستند بعد التعديل
        );

        if (!order) {
            return NextResponse.json({ success: false, message: "الطلب غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order });
    } catch (err) {
        console.error("❌ خطأ أثناء تحديث حالة الطلب: ", err);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم الداخلي" }, { status: 500 });
    }
}
