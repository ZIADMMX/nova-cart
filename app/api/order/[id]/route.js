import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import Order from "@/model/Order";
import connectToMongo from "@/lib/db";

export async function PUT(request, { params }) {
    try {
        // 1. التحقق من الصNoحيات (أدمن فقط)
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك للقيام بهذا الإجراء" }, { status: 403 });
        }

        // 2. استقبال المعرف وOrder Status الجديدة
        const { id } = await params;
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ success: false, message: "الحالة الجديدة مطلوبة" }, { status: 400 });
        }

        // 3. اNoتصال بقاعدة البيانات
        await connectToMongo();

        // 4. تحديث Order Status
        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true } // إرجاع المستند بعد الEdit
        );

        if (!order) {
            return NextResponse.json({ success: false, message: "الطلب غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order });
    } catch (err) {
        console.error("❌ Error أثناء تحديث Order Status: ", err);
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك لحذف هذا الطلب" }, { status: 403 });
        }

        const { id } = await params;

        await connectToMongo();

        const order = await Order.findByIdAndDelete(id);
        if (!order) {
            return NextResponse.json({ success: false, message: "الطلب غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "تم حذف الطلب بنجاح" });
    } catch (err) {
        console.error("❌ Error أثناء حذف الطلب: ", err);
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    }
}
