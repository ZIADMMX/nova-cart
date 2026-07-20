import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import { getAuthFromCookie } from "@/lib/auth";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

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
            return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً لإتمام الشراء" }, { status: 401 });
        }

        if (isRateLimited(auth.userId)) {
            return NextResponse.json({ error: "لقد تجاوزت عدد المحاولات المسموحة. يرجى الانتظار دقيقة والمحاولة مجدداً." }, { status: 429 });
        }

        const body = await request.json();
        const { items } = body; // Array of cart items

        if (!items || !items.length) {
            return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
        }

        await connectToMongo();

        let totalPrice = 0;
        const orderItems = [];
        const line_items = [];

        for (const item of items) {
            const product = await Product.findById(item._id || item.id);
            if (!product) {
                // 🛠️ تصحيح: استخدام title بدلاً من name لمنع الـ undefined
                return NextResponse.json({ error: `المنتج ${item.title || "المطلوب"} غير موجود في قاعدة البيانات` }, { status: 404 });
            }

            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `الكمية المطلوبة لـ ${product.title} غير متوفرة في المخزن.` }, { status: 400 });
            }

            totalPrice += product.price * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.title,
                price: product.price,
                image: product.imageUrl,
                qty: item.quantity,
            });

            // 🛠️ تأمين رابط الصورة لـ Stripe: يجب أن يكون مطلقاً ويبدأ بـ https
            const validImageUrl = product.imageUrl && product.imageUrl.startsWith("http") 
                ? product.imageUrl 
                : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"; // صورة بديلة عامة مقبولة لدى Stripe

            line_items.push({
                price_data: {
                    currency: (product.currency || "egp").toLowerCase(), // 🇪🇬 التكيف التلقائي مع عملة المنتج
                    product_data: {
                        name: product.title,
                        images: [validImageUrl], // تمرير الرابط الآمن والمطابق لسياسة Stripe
                    },
                    unit_amount: Math.round(product.price * 100), // تحويل السعر لـ Cents/Piasters
                },
                quantity: item.quantity,
            });
        }

        const order = new Order({
            user: auth.userId,
            orderItems,
            totalPrice,
            status: "Pending"
        });

        await order.save();

        if (!stripe) {
            return NextResponse.json({ error: "بوابة دفع Stripe غير مهيأة (STRIPE_SECRET_KEY مفقود)" }, { status: 500 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Cancel`,
            metadata: {
                orderId: order._id.toString(),
                isCart: "true"
            }
        });

        order.stripeSessionId = session.id;
        await order.save();

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("❌ Cart Checkout Error:", error);
        return NextResponse.json({ error: "حدث خطأ داخلي في الخادم" }, { status: 500 });
    }
}
