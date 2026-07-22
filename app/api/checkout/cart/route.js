import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import { getAuthFromCookie } from "@/lib/auth";
import crypto from "crypto";

const rateLimitMap = new Map();

// 🛡️ دالة Rate Limit محسنة تمنع تسريب الذاكرة (Memory Leak)
function isRateLimited(userId) {
    const windowMs = 60 * 1000;
    const limit = 3;
    const now = Date.now();
    
    // تنظيف دوري للـ Map بأكملها كل فترة لمنع تضخم الذاكرة في الـ Serverless
    if (rateLimitMap.size > 1000) {
        for (const [key, val] of rateLimitMap.entries()) {
            const activeRequests = val.filter(time => now - time < windowMs);
            if (activeRequests.length === 0) rateLimitMap.delete(key);
        }
    }

    const userRequests = rateLimitMap.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
        return true;
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);
    
    return false;
}

export async function POST(request) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: "يرجى Sign In أوNoً لإتمام الشراء" }, { status: 401 });
        }

        if (isRateLimited(auth.userId)) {
            return NextResponse.json({ error: "لقد تجاوزت عدد المحاوNoت المسموحة. يرجى اNoنتظار دقيقة والمحاولة مجدداً." }, { status: 429 });
        }

        const body = await request.json();
        const { items } = body; // Array of cart items

        if (!items || !items.length) {
            return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
        }

        await connectToMongo();

        let totalPrice = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item._id || item.id);
            if (!product) {
                // 🛠️ تصحيح: استخدام title بدNoً من name لمنع الـ undefined
                return NextResponse.json({ error: `المنتج ${item.title || "المطلوب"} غير موجود في قاعدة البيانات` }, { status: 404 });
            }

            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `Quantity المطلوبة لـ ${product.title} Out of Stockة في المخزن.` }, { status: 400 });
            }

            totalPrice += product.price * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.title,
                price: product.price,
                image: product.imageUrl,
                qty: item.quantity,
            });
        }

        const order = new Order({
            user: auth.userId,
            orderItems,
            totalPrice,
            paymentMethod: "Kashier",
            status: "Pending"
        });

        await order.save();

        const kashierSecretKey = process.env.KASHIER_SECRET_KEY || process.env.KASHIER_API_KEY;
        const kashierMid = process.env.KASHIER_MID;

        if (!kashierSecretKey || !kashierMid) {
            return NextResponse.json({ error: "Kashier payment is not configured. تحقق من KASHIER_SECRET_KEY و KASHIER_MID." }, { status: 500 });
        }

        const formattedAmount = totalPrice.toFixed(2);
        const orderId = order._id.toString();
        const kashierCurrency = "EGP";
        const pathString = `/?payment=${kashierMid}.${orderId}.${formattedAmount}.${kashierCurrency}`;
        const hash = crypto.createHmac("sha256", kashierSecretKey)
            .update(pathString)
            .digest("hex");

        const merchantRedirect = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Success`;
        const kashierUrl = `https://checkout.kashier.io/?` +
            `merchantId=${kashierMid}` +
            `&orderId=${orderId}` +
            `&amount=${formattedAmount}` +
            `&currency=${kashierCurrency}` +
            `&hash=${hash}` +
            `&merchantRedirect=${merchantRedirect}` +
            `&mode=${process.env.KASHIER_MODE || "test"}` +
            `&failureRedirect=true` +
            `&redirectMethod=get` +
            `&display=ar`;

        return NextResponse.json({ success: true, url: kashierUrl });

    } catch (error) {
        console.error("❌ Cart Checkout Error:", error);
        return NextResponse.json({ error: "حدث Error داخلي في الخادم" }, { status: 500 });
    }
}
