import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToMongo from "@/lib/db";
import Order from "@/model/Order";
import { processOrderSuccess } from "@/lib/orderProcessor";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const session_id = searchParams.get("session_id");

        if (!session_id) {
            return NextResponse.json({ success: false, message: "معرف الجلسة مطلوب" }, { status: 400 });
        }

        await connectToMongo();

        // 📝 التعامل مع طلبات الدفع عند الاستلام (COD)
        if (session_id.startsWith("COD-")) {
            const orderId = session_id.split("COD-")[1];
            let order = await Order.findByIdAndUpdate(
                orderId,
                { $set: { paymentMethod: "COD" } },
                { new: true }
            );
            if (order) {
                await processOrderSuccess(order);
                return NextResponse.json({ success: true });
            }
            return NextResponse.json({ success: false, message: "الطلب غير موجود" }, { status: 404 });
        }

        if (!stripe) {
            return NextResponse.json({ success: false, message: "بوابة دفع Stripe غير مهيأة (STRIPE_SECRET_KEY مفقود)" }, { status: 500 });
        }
        // التحقق من Stripe أن الدفع نجح
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === "paid") {
            const orderId = session.metadata?.orderId;
            if (orderId) {
                // تحديث حالة الطلب وخصم المخزون مع ضمان عدم التكرار
                let order = await Order.findOneAndUpdate(
                    { _id: orderId, status: "Pending" },
                    {
                        $set: {
                            status: "Paid",
                            paymentResult: {
                                id: session.id,
                                status: session.payment_status,
                                email_address: session.customer_details?.email || ""
                            }
                        }
                    },
                    { new: true }
                );

                if (order) {
                    await processOrderSuccess(order);
                    console.log(`✅ تم تأكيد الطلب ${orderId} بنجاح عبر التحقق من الجلسة.`);
                }
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "لم يتم دفع قيمة الطلب بعد" }, { status: 400 });

    } catch (error) {
        console.error("❌ خطأ أثناء التحقق من الجلسة:", error);
        return NextResponse.json({ success: false, message: "حدث خطأ داخلي في الخادم" }, { status: 500 });
    }
}
