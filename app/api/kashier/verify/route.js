import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToMongo from "@/lib/db";
import Order from "@/model/Order";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentStatus = searchParams.get("paymentStatus");
        const signature = searchParams.get("signature");
        const merchantOrderId = searchParams.get("merchantOrderId");

        if (!paymentStatus || !signature || !merchantOrderId) {
            return NextResponse.json({ success: false, message: "بيانات التحقق غير Completedة" }, { status: 400 });
        }

        const apiKey = process.env.KASHIER_SECRET_KEY || process.env.KASHIER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, message: "مفتاح API/السر الخاص بكاشير غير مهيأ" }, { status: 500 });
        }

        // تحضير البيانات لحساب التوقيع الرقمي ومطابقته لمنع التNoعب
        const queryObj = Object.fromEntries(searchParams.entries());
        
        const getVal = (key) => {
            const val = queryObj[key];
            return val === undefined ? "undefined" : val;
        };

        const queryString = 
            "&paymentStatus=" + getVal("paymentStatus") +
            "&cardDataToken=" + getVal("cardDataToken") +
            "&maskedCard=" + getVal("maskedCard") +
            "&merchantOrderId=" + getVal("merchantOrderId") +
            "&orderId=" + getVal("orderId") +
            "&cardBrand=" + getVal("cardBrand") +
            "&orderReference=" + getVal("orderReference") +
            "&transactionId=" + getVal("transactionId") +
            "&amount=" + getVal("amount") +
            "&currency=" + getVal("currency");

        const finalUrl = queryString.substring(1); // إزالة أول &
        
        const calculatedSignature = crypto.createHmac("sha256", apiKey)
            .update(finalUrl)
            .digest("hex");

        if (calculatedSignature !== signature) {
            console.error("❌ Kashier Signature Mismatch");
            return NextResponse.json({ success: false, message: "فشل التحقق من التوقيع الرقمي" }, { status: 400 });
        }

        if (paymentStatus !== "SUCCESS") {
            return NextResponse.json({ success: false, message: "عملية Checkout لم تكتمل بSuccess" }, { status: 400 });
        }

        await connectToMongo();

        // تحديث Order Status في قاعدة البيانات وتخزين معلومات المعاملة
        const order = await Order.findOneAndUpdate(
            { _id: merchantOrderId, status: "Pending" },
            {
                $set: {
                    status: "Paid",
                    paymentResult: {
                        id: queryObj["transactionId"] || "",
                        status: paymentStatus,
                        email_address: queryObj["cardBrand"] || "Kashier Card"
                    }
                }
            },
            { new: true }
        );

        if (order) {
            console.log(`✅ تم تأكيد ودفع الطلب ${merchantOrderId} بSuccess عبر كاشير.`);
            return NextResponse.json({ success: true });
        }

        // إذا كان الطلب قد تم تأكيده بالفعل من قبل (مثNoً لو أعاد العميل Loading الصفحة)
        const existingOrder = await Order.findById(merchantOrderId);
        if (existingOrder && existingOrder.status === "Paid") {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "الطلب غير موجود أو تمت معالجته بالفعل" }, { status: 404 });

    } catch (error) {
        console.error("❌ Error أثناء التحقق من دفع كاشير:", error);
        return NextResponse.json({ success: false, message: "حدث Error داخلي في الخادم" }, { status: 500 });
    }
}
