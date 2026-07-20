import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import Notification from "@/model/Notfication"; // تم استيراد موديل الإشعارات بالاسم والمسار الصحيحين
import { getAuthFromCookie } from "@/lib/auth";

export async function GET(req, context) {
    try {
        const { id } = await context.params;
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId) {
            return NextResponse.json(
                { success: false, message: "يرجى تسجيل الدخول أولاً" },
                { status: 401 }
            );
        }

        await connectToMongo();
        const order = await Order.findById(id)
            .populate("user", "name email")
            .populate("orderItems.product")
            .lean();

        if (!order) {
            return NextResponse.json(
                { success: false, message: "الطلب غير موجود" },
                { status: 404 }
            );
        }

        // السماح بالوصول للأدمن أو صاحب الطلب نفسه فقط
        const orderUserId = order.user?._id?.toString() || order.user?.toString();
        if (auth.role !== "admin" && auth.role !== "super_admin" && orderUserId !== auth.userId) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك بمشاهدة تفاصيل هذا الطلب" },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error("❌ خطأ أثناء جلب الطلب:", error);
        return NextResponse.json(
            { success: false, message: "حدث خطأ داخلي في الخادم" },
            { status: 500 }
        );
    }
}

export async function PATCH(req, context) {
    try {
        const { id } = await context.params;
        const { status } = await req.json();

        // 1. التحقق من هوية وصلاحية المستخدم (أدمن أو سوبر أدمن فقط)
        const auth = await getAuthFromCookie(); // تصحيح استدعاء الدالة بإضافة الأقواس ()
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك لتعديل حالة الطلبات" },
                { status: 403 }
            );
        }

        await connectToMongo();

        // 2. جلب الطلب والتحقق من وجوده
        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, message: "الطلب غير موجود" },
                { status: 404 }
            );
        }

        // تم إزالة قيود التسلسل لإعطاء الأدمن حرية كاملة في تغيير الحالة

        // 4. تحديث حالة الطلب وإرجاع المخزون في حال الإلغاء بعد الدفع
        if (status === "Cancelled" && ["Pending", "Paid", "Processing", "Shipped"].includes(order.status)) {
            for (const item of order.orderItems) {
                const productId = item.product?._id || item.product;
                if (productId) {
                    await Product.findByIdAndUpdate(productId, { 
                        $inc: { stock: Math.abs(item.qty || 1) } 
                    });
                }
            }
        }

        order.status = status;
        await order.save();

        // 5. إنشاء إشعار للمستخدم بتحديث حالة الطلب
        await Notification.create({
            userId: order.user, // تصحيح اسم الحقل لـ userId ليتطابق مع الـ Schema
            message: `تم تحديث حالة طلبك رقم #${order._id.toString().slice(-8).toUpperCase()} إلى: ${status}`,
            type: "info",
            isRead: false
        });

        return NextResponse.json({ success: true, order });

    } catch (error) {
        console.error("❌ خطأ أثناء تحديث حالة الطلب:", error);
        return NextResponse.json(
            { success: false, message: error.message || "حدث خطأ داخلي في الخادم" },
            { status: 500 }
        );
    }
}
