import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToMongo from "@/lib/db";
import Order from "@/model/Order";
import Product from "@/model/Product";
import { headers } from "next/headers";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    try {
        if (!stripe) {
            return NextResponse.json({ error: "Stripe not initialized" }, { status: 500 });
        }
        const body = await req.text();
        const headersList = await headers();
        const signature = headersList.get("stripe-signature");


        if (!signature || !endpointSecret) {
            console.warn("⚠️ إعدادات الـ Webhook غير مكتملة أو التوقيع مفقود.");
            return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        } catch (err) {
            console.error("❌ خطأ في توقيع Stripe Webhook:", err.message);
            return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
        }

        // معالجة حدث نجاح الدفع
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const orderId = session.metadata?.orderId;

            if (orderId) {
                await connectToMongo();

                // تحديث حالة الطلب إلى Paid
                // نستخدم findOneAndUpdate مع status: "Pending" لمنع التكرار (Idempotency)
                const order = await Order.findOneAndUpdate(
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

                // إذا وجدنا الطلب وتم تحديثه (يعني أنه لم يُحدث من قبل)
                if (order) {
                    // 🚨 ملاحظة: تم إزالة كود خصم المخزون من هنا لأنه يتم حجزه مسبقاً في الـ Checkout لمنع الـ Overselling
                    console.log(`✅ تم تأكيد الطلب ${orderId} بنجاح عبر Webhook (المخزون محجوز مسبقاً).`);
                } else {
                    console.log(`ℹ️ الطلب ${orderId} تم تأكيده مسبقاً.`);
                }
            }
        } else if (event.type === "checkout.session.expired") {
            // 🚨 معالجة الحدث عند انتهاء الجلسة دون دفع (بعد 30 دقيقة) لاسترجاع المخزون
            const session = event.data.object;
            const orderId = session.metadata?.orderId;
            
            if (orderId) {
                await connectToMongo();
                const order = await Order.findOneAndUpdate(
                    { _id: orderId, status: "Pending" },
                    { $set: { status: "Cancelled" } },
                    { new: true }
                );
                
                if (order) {
                    // استرجاع المخزون المحجوز لأن العميل لم يدفع
                    for (const item of order.orderItems) {
                        const productId = item.product?._id || item.product;
                        if (productId) {
                            await Product.findByIdAndUpdate(productId, {
                                $inc: { stock: Math.abs(item.qty || 1) }
                            });
                        }
                    }
                    console.log(`♻️ تم إلغاء الطلب ${orderId} واسترجاع المخزون لعدم إتمام الدفع في الوقت المحدد.`);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("❌ خطأ داخلي في الـ Webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
