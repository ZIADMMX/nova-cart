import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToMongo from "@/lib/db";
import Order from "@/model/Order";

import mongoose from "mongoose";

// الحقول المطلوبة لحساب الـ HMAC بالترتيب الدقيق المحدد من Paymob
const HMAC_FIELDS = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success"
];

// دالة التحقق من صحة التوقيع الرقمي (HMAC)
function verifySignature(concatenatedString, receivedHmac, hmacSecret) {
    const calculatedHmac = crypto
        .createHmac("sha512", hmacSecret)
        .update(concatenatedString)
        .digest("hex");
    return calculatedHmac === receivedHmac;
}

// 1. معالجة إعادة توجيه المستخدم (GET Callback)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const receivedHmac = searchParams.get("hmac");
        const paymobOrderId = searchParams.get("order");
        const transactionId = searchParams.get("id");
        const success = searchParams.get("success");
        const merchantOrderId = searchParams.get("merchant_order_id");

        if (!receivedHmac || !paymobOrderId || !transactionId) {
            return NextResponse.json({ success: false, message: "بيانات التحقق غير مكتملة" }, { status: 400 });
        }

        const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
        if (!hmacSecret) {
            console.error("❌ PAYMOB_HMAC_SECRET is not configured in environment variables.");
            return NextResponse.json({ success: false, message: "مفتاح HMAC لـ Paymob غير مهيأ" }, { status: 500 });
        }

        const getVal = (key) => {
            let val = searchParams.get(key);
            if (val === null || val === undefined) {
                const altKey = key.replace(/\./g, "_");
                val = searchParams.get(altKey);
            }
            return val !== null && val !== undefined ? String(val) : "";
        };

        const concatenatedString = HMAC_FIELDS.map(getVal).join("");
        const calculatedHmac = crypto
            .createHmac("sha512", hmacSecret)
            .update(concatenatedString)
            .digest("hex");

        const debugInfo = `
=== Paymob GET HMAC Debug ===
Time: ${new Date().toISOString()}
concatenatedString: ${concatenatedString}
receivedHmac: ${receivedHmac}
calculatedHmac: ${calculatedHmac}
match: ${calculatedHmac === receivedHmac}
query: ${searchParams.toString()}
`;
        require("fs").appendFileSync("hmac_debug.log", debugInfo);

        if (calculatedHmac !== receivedHmac) {
            console.error("❌ Paymob GET Callback HMAC Mismatch!");
            return NextResponse.json({ success: false, message: "فشل التحقق من التوقيع الرقمي" }, { status: 400 });
        }

        if (success !== "true") {
            return NextResponse.json({ success: false, message: "عملية الدفع لم تكتمل بنجاح" }, { status: 400 });
        }

        await connectToMongo();

        let order = null;
        // 1. البحث أولاً باستخدام المعرف الداخلي للمتجر merchant_order_id
        if (merchantOrderId && mongoose.Types.ObjectId.isValid(merchantOrderId)) {
            order = await Order.findOneAndUpdate(
                { _id: merchantOrderId, status: "Pending" },
                {
                    $set: {
                        status: "Paid",
                        paymentResult: {
                            id: transactionId,
                            status: "Paid",
                            email_address: getVal("source_data.pan") || "Paymob Card (Redirect)"
                        }
                    }
                },
                { new: true }
            );
        }

        // 2. إذا لم يعثر عليه، نبحث باستخدام paymobOrderId للطلب
        if (!order) {
            order = await Order.findOneAndUpdate(
                { paymobOrderId: paymobOrderId, status: "Pending" },
                {
                    $set: {
                        status: "Paid",
                        paymentResult: {
                            id: transactionId,
                            status: "Paid",
                            email_address: getVal("source_data.pan") || "Paymob Card (Redirect)"
                        }
                    }
                },
                { new: true }
            );
        }

        if (order) {
            console.log(`✅ [GET Callback] تم تأكيد ودفع الطلب ${order._id} بنجاح عبر Paymob.`);
            return NextResponse.json({ success: true });
        }

        const existingOrder = await Order.findOne({ 
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(merchantOrderId) ? merchantOrderId : null },
                { paymobOrderId: paymobOrderId }
            ]
        });

        if (existingOrder && existingOrder.status === "Paid") {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "الطلب غير موجود أو تمت معالجته بالفعل" }, { status: 404 });

    } catch (error) {
        console.error("❌ خطأ أثناء التحقق من دفع Paymob (GET):", error);
        return NextResponse.json({ success: false, message: "حدث خطأ داخلي في الخادم" }, { status: 500 });
    }
}

// 2. معالجة إشعارات الخادم الخلفية (POST Webhook)
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, obj } = body;

        if (type !== "TRANSACTION") {
            return NextResponse.json({ success: true, message: "تم تجاهل الحدث (ليس معاملة مالية)" });
        }

        const { searchParams } = new URL(request.url);
        const receivedHmac = searchParams.get("hmac");

        if (!receivedHmac) {
            return NextResponse.json({ success: false, message: "التوقيع الرقمي HMAC مفقود" }, { status: 400 });
        }

        const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
        if (!hmacSecret) {
            console.error("❌ PAYMOB_HMAC_SECRET is not configured in environment variables.");
            return NextResponse.json({ success: false, message: "مفتاح HMAC لـ Paymob غير مهيأ" }, { status: 500 });
        }

        const getVal = (key) => {
            if (key === "order") {
                return obj.order && obj.order.id ? String(obj.order.id) : "";
            }
            if (key.startsWith("source_data.")) {
                const subKey = key.split(".")[1];
                return obj.source_data && obj.source_data[subKey] !== undefined ? String(obj.source_data[subKey]) : "";
            }
            return obj[key] !== undefined ? String(obj[key]) : "";
        };

        const concatenatedString = HMAC_FIELDS.map(getVal).join("");

        if (!verifySignature(concatenatedString, receivedHmac, hmacSecret)) {
            console.error("❌ Paymob POST Webhook HMAC Mismatch!");
            return NextResponse.json({ success: false, message: "فشل التحقق من التوقيع الرقمي" }, { status: 400 });
        }

        if (String(obj.success) !== "true") {
            return NextResponse.json({ success: true, message: "تم التحقق من المعاملة لكنها غير ناجحة" });
        }

        await connectToMongo();

        const paymobOrderId = obj.order && obj.order.id ? String(obj.order.id) : "";
        const transactionId = String(obj.id);
        const sourcePan = obj.source_data && obj.source_data.pan ? String(obj.source_data.pan) : "";
        const merchantOrderId = obj.merchant_order_id;

        let order = null;
        // 1. البحث أولاً باستخدام المعرف الداخلي للمتجر merchant_order_id
        if (merchantOrderId && mongoose.Types.ObjectId.isValid(merchantOrderId)) {
            order = await Order.findOneAndUpdate(
                { _id: merchantOrderId, status: "Pending" },
                {
                    $set: {
                        status: "Paid",
                        paymentResult: {
                            id: transactionId,
                            status: "Paid",
                            email_address: sourcePan || "Paymob Card (Webhook)"
                        }
                    }
                },
                { new: true }
            );
        }

        // 2. إذا لم يعثر عليه، نبحث باستخدام paymobOrderId
        if (!order) {
            order = await Order.findOneAndUpdate(
                { paymobOrderId: paymobOrderId, status: "Pending" },
                {
                    $set: {
                        status: "Paid",
                        paymentResult: {
                            id: transactionId,
                            status: "Paid",
                            email_address: sourcePan || "Paymob Card (Webhook)"
                        }
                    }
                },
                { new: true }
            );
        }

        if (order) {
            console.log(`✅ [POST Webhook] تم تأكيد ودفع الطلب ${order._id} بنجاح عبر Paymob.`);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("❌ خطأ أثناء التحقق من دفع Paymob (POST Webhook):", error);
        return NextResponse.json({ success: false, message: "حدث خطأ داخلي في الخادم" }, { status: 500 });
    }
}
