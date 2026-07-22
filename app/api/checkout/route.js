import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import User from "@/model/User";
import { getAuthFromCookie } from "@/lib/auth";
import crypto from "crypto";


const rateLimitMap = new Map();

function isRateLimited(userId) {
    const windowMs = 60 * 1000;
    const limit = 5; // 5 requests per minute
    const now = Date.now();
    
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
            return NextResponse.json({ error: "لقد تجاوزت عدد المحاوNoت المسموحة. يرجى المحاولة بعد دقيقة." }, { status: 429 });
        }

        const body = await request.json();
        const { items, shippingAddress, paymentMethod } = body;

        // 1. التحقق من البيانات
        if (!items || !items.length) {
            return NextResponse.json({ error: "No products found في الطلب" }, { status: 400 });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.streetName) {
            return NextResponse.json({ error: "جميع بيانات الShipping مطلوبة" }, { status: 400 });
        }

        if (!["COD", "Kashier"].includes(paymentMethod)) {
            return NextResponse.json({ error: "طريقة Checkout غير صالحة" }, { status: 400 });
        }

        await connectToMongo();
        const user = await User.findById(auth.userId);

        let totalPrice = 0;
        const orderItems = [];

        // 2. معالجة Products والتحقق من المخزون
        for (const item of items) {
            const product = await Product.findById(item._id || item.id);
            if (!product) {
                return NextResponse.json({ error: `المنتج المطلوبة غير موجود في قاعدة البيانات` }, { status: 404 });
            }

            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `Quantity المطلوبة لـ ${product.title} Out of Stockة في المخزن.` }, { status: 400 });
            }

            // حجز المخزون ذرياً (Atomic) لمنع الـ Overselling
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: product._id, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (!updatedProduct) {
                return NextResponse.json({ error: `عذراً، نفدت كمية ${product.title} للتو.` }, { status: 400 });
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

        // 3. إنشاء الطلب في قاعدة البيانات
        const order = new Order({
            user: auth.userId,
            orderItems,
            totalPrice,
            shippingAddress,
            paymentMethod,
            status: "Pending", // كNoهما يبدأ كـ Pending
        });

        await order.save();

        // 4. التعامل مع طرق Checkout
        if (paymentMethod === "COD") {
            // Checkout عند اNoستNoم: نرجع العميل مباشرة لصفحة الSuccess
            return NextResponse.json({ 
                success: true, 
                url: `/Success?session_id=COD-${order._id.toString()}` 
            });
        }

        const kashierSecretKey = process.env.KASHIER_SECRET_KEY || process.env.KASHIER_API_KEY;
        const kashierMid = process.env.KASHIER_MID;

        if (paymentMethod === "Kashier") {
            if (!kashierSecretKey || !kashierMid) {
                return NextResponse.json({ error: "Kashier payment is not configured. تحقق من KASHIER_SECRET_KEY و KASHIER_MID." }, { status: 500 });
            }

            const kashierMode = process.env.KASHIER_MODE || "test";
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
                `&mode=${kashierMode}` +
                `&failureRedirect=true` +
                `&redirectMethod=get` +
                `&display=ar`;

            return NextResponse.json({ success: true, url: kashierUrl });
        }

        return NextResponse.json({ error: "طريقة الدفع غير معتمدة. اختر Kashier أو COD." }, { status: 400 });

    } catch (error) {
        console.error("❌ Checkout API Error:", error);
        return NextResponse.json({ error: "حدث Error داخلي في الخادم" }, { status: 500 });
    }
}
