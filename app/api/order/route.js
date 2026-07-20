import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import Order from "@/model/Order";
import connectToMongo from "@/lib/db";

export async function GET(request) {
    try {
        // 1. التحقق من هوية وصلاحية المستخدم (أدمن فقط)
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بالوصول" }, { status: 403 });
        }

        // 2. الاتصال بقاعدة البيانات
        await connectToMongo();

        const { searchParams } = new URL(request.url);
        const pageVal = searchParams.get('page');

        if (pageVal) {
            const page = parseInt(pageVal) || 1;
            const limit = parseInt(searchParams.get('limit')) || 10;
            const skip = (page - 1) * limit;

            const total = await Order.countDocuments({});
            const orders = await Order.find({})
                .populate("user", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            return NextResponse.json({
                orders,
                page,
                pages: Math.ceil(total / limit),
                total
            });
        }

        // 3. جلب جميع الطلبات مع تفاصيل المستخدم المشتري
        const orders = await Order.find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(orders);
    } catch (err) {
        console.error("❌ خطأ أثناء جلب جميع الطلبات للأدمن: ", err);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم الداخلي" }, { status: 500 });
    }
}
