import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import User from "@/model/User";
import { getAuthFromCookie } from "@/lib/auth";
import crypto from "crypto";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;


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
            return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً لإتمام الشراء" }, { status: 401 });
        }

        if (isRateLimited(auth.userId)) {
            return NextResponse.json({ error: "لقد تجاوزت عدد المحاولات المسموحة. يرجى المحاولة بعد دقيقة." }, { status: 429 });
        }

        const body = await request.json();
        const { items, shippingAddress, paymentMethod } = body;

        // 1. التحقق من البيانات
        if (!items || !items.length) {
            return NextResponse.json({ error: "لا توجد منتجات في الطلب" }, { status: 400 });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.streetName) {
            return NextResponse.json({ error: "جميع بيانات الشحن مطلوبة" }, { status: 400 });
        }

        if (!["COD", "Card"].includes(paymentMethod)) {
            return NextResponse.json({ error: "طريقة الدفع غير صالحة" }, { status: 400 });
        }

        await connectToMongo();
        const user = await User.findById(auth.userId);

        let totalPrice = 0;
        const orderItems = [];
        const line_items = [];
        let orderCurrency = "EGP";

        // 2. معالجة المنتجات والتحقق من المخزون
        for (const item of items) {
            const product = await Product.findById(item._id || item.id);
            if (!product) {
                return NextResponse.json({ error: `المنتج المطلوبة غير موجود في قاعدة البيانات` }, { status: 404 });
            }
            if (product.currency) {
                orderCurrency = product.currency.toUpperCase();
            }

            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `الكمية المطلوبة لـ ${product.title} غير متوفرة في المخزن.` }, { status: 400 });
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

            const validImageUrl = product.imageUrl && product.imageUrl.startsWith("http") 
                ? product.imageUrl 
                : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

            line_items.push({
                price_data: {
                    currency: (product.currency || "usd").toLowerCase(),
                    product_data: {
                        name: product.title,
                        images: [validImageUrl],
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: item.quantity,
            });
        }

        // 3. إنشاء الطلب في قاعدة البيانات
        const order = new Order({
            user: auth.userId,
            orderItems,
            totalPrice,
            shippingAddress,
            paymentMethod,
            status: "Pending", // كلاهما يبدأ كـ Pending
        });

        await order.save();

        // 4. التعامل مع طرق الدفع
        if (paymentMethod === "COD") {
            // الدفع عند الاستلام: نرجع العميل مباشرة لصفحة النجاح
            return NextResponse.json({ 
                success: true, 
                url: `/Success?session_id=COD-${order._id.toString()}` 
            });
        } else {
            const paymobApiKey = process.env.PAYMOB_API_KEY;
            const paymobIntegrationId = process.env.PAYMOB_INTEGRATION_ID;
            const paymobIframeId = process.env.PAYMOB_IFRAME_ID;

            const kashierSecretKey = process.env.KASHIER_SECRET_KEY || process.env.KASHIER_API_KEY;
            const kashierMid = process.env.KASHIER_MID;

            if (paymobApiKey && paymobIntegrationId && paymobIframeId) {
                // 💳 الدفع بالفيزا (Paymob)
                try {
                    // 1. طلب رمز المصادقة (Authentication Request)
                    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ api_key: paymobApiKey })
                    });
                    
                    if (!authRes.ok) {
                        const errText = await authRes.text();
                        throw new Error(`فشلت مصادقة Paymob: ${errText}`);
                    }
                    
                    const authData = await authRes.json();
                    const authToken = authData.token;

                    // 2. تسجيل الطلب في Paymob (Order Registration)
                    const paymobItems = orderItems.map(item => ({
                        name: item.name,
                        amount_cents: Math.round(item.price * 100),
                        description: item.name,
                        quantity: item.qty
                    }));

                    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            auth_token: authToken,
                            delivery_needed: false,
                            amount_cents: Math.round(totalPrice * 100),
                            currency: "EGP",
                            merchant_order_id: order._id.toString(),
                            items: paymobItems
                        })
                    });

                    if (!orderRes.ok) {
                        const errText = await orderRes.text();
                        throw new Error(`فشل تسجيل طلب Paymob: ${errText}`);
                    }

                    const orderData = await orderRes.json();
                    const paymobOrderId = orderData.id;

                    // حفظ معرف طلب Paymob في قاعدة البيانات للتحقق لاحقاً
                    order.paymobOrderId = paymobOrderId.toString();
                    await order.save();

                    // 3. توليد مفتاح الدفع (Payment Key Generation)
                    const nameParts = (shippingAddress.fullName || "Customer Name").trim().split(/\s+/);
                    const firstName = nameParts[0] || "Customer";
                    const lastName = nameParts.slice(1).join(" ") || "Customer";

                    const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            auth_token: authToken,
                            amount_cents: Math.round(totalPrice * 100),
                            expiration: 3600,
                            order_id: paymobOrderId,
                            billing_data: {
                                apartment: "NA",
                                email: (user && user.email) || "customer@example.com",
                                floor: "NA",
                                first_name: firstName,
                                street: shippingAddress.streetName || "NA",
                                building: "NA",
                                phone_number: shippingAddress.phone || "NA",
                                shipping_method: "NA",
                                postal_code: "NA",
                                city: shippingAddress.city || "Cairo",
                                country: "EG",
                                last_name: lastName
                            },
                            currency: "EGP",
                            integration_id: parseInt(paymobIntegrationId)
                        })
                    });

                    if (!keyRes.ok) {
                        const errText = await keyRes.text();
                        throw new Error(`فشل إنشاء مفتاح الدفع لـ Paymob: ${errText}`);
                    }

                    const keyData = await keyRes.json();
                    const paymentToken = keyData.token;

                    // 4. توجيه العميل إلى صفحة الدفع (Iframe)
                    const paymobUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobIframeId}?payment_token=${paymentToken}`;
                    return NextResponse.json({ success: true, url: paymobUrl });

                } catch (paymobErr) {
                    console.error("❌ Paymob API Error:", paymobErr);
                    return NextResponse.json({ error: paymobErr.message || "فشلت عملية إنشاء رابط دفع Paymob" }, { status: 500 });
                }
            } else if (kashierSecretKey && kashierMid) {
                // الدفع بالفيزا (Kashier)
                const kashierMode = process.env.KASHIER_MODE || "test";
                const formattedAmount = totalPrice.toFixed(2);
                const orderId = order._id.toString();
                
                // حساب التوقيع الرقمي (Hash) لكاشير - نجبر العملة لتكون EGP لأن كاشير تدعم الجنيه المصري فقط كافتراضي
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
            } else {
                if (!stripe) {
                    return NextResponse.json({ error: "بوابة دفع Stripe غير مهيأة (STRIPE_SECRET_KEY مفقود)" }, { status: 500 });
                }
                // الدفع بالفيزا (Stripe): ننشئ جلسة Stripe
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    line_items,
                    mode: "payment",
                    expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // صلاحية 30 دقيقة
                    success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Cancel`,
                    metadata: {
                        orderId: order._id.toString(),
                    }
                });

                order.stripeSessionId = session.id;
                await order.save();

                return NextResponse.json({ success: true, url: session.url });
            }
        }


    } catch (error) {
        console.error("❌ Checkout API Error:", error);
        return NextResponse.json({ error: "حدث خطأ داخلي في الخادم" }, { status: 500 });
    }
}
