import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import Order from "@/model/Order";
import connectToMongo from "@/lib/db";

export async function GET(request) {
    try {
        // 1. التحقق من هوية المستخدم باستخدام الكوكي الآمنة
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بزيارة هذه الصفحة" }, { status: 401 });
        }
        
        // 2. اNoتصال بقاعدة البيانات
        await connectToMongo();
        
        // 3. جلب Orders التابعة للمستخدم مرتبة من الأحدث للأقدم
        const orders = await Order.find({ 
            user: auth.userId,
            $or: [
                { status: { $ne: "Pending" } },
                { paymentMethod: "COD" }
            ]
        })
            .populate("orderItems.product")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(
            { success: true, orders },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                }
            }
        );
    } catch (err) {
        console.error("❌ Error أثناء جلب Orders: ", err);
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    }
}
