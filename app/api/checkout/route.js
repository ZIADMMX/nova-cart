import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import User from "@/model/User";
import Coupon from "@/model/Coupon";
import { getAuthFromCookie } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key");

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
        const { items, shippingAddress, paymentMethod, couponCode } = body;

        // 1. التحقق من البيانات
        if (!items || !items.length) {
            return NextResponse.json({ error: "No products found في الطلب" }, { status: 400 });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.streetName) {
            return NextResponse.json({ error: "جميع بيانات الShipping مطلوبة" }, { status: 400 });
        }

        if (!["COD", "Stripe"].includes(paymentMethod)) {
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

        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            
            if (coupon && new Date() <= new Date(coupon.expiryDate)) {
                if ((!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) && 
                    (coupon.minOrderAmount === 0 || totalPrice >= coupon.minOrderAmount)) {
                    
                    if (coupon.type === 'percentage') {
                        discountAmount = (totalPrice * coupon.value) / 100;
                    } else if (coupon.type === 'fixed') {
                        discountAmount = coupon.value;
                    } else if (coupon.type === 'free_shipping') {
                        // Assuming shipping is handled, for now we just mark it.
                        // If there is a fixed shipping cost, discountAmount = shippingCost
                        discountAmount = 0; // Or whatever shipping cost is
                    }
                    
                    // Ensure discount doesn't exceed total price
                    if (discountAmount > totalPrice) {
                        discountAmount = totalPrice;
                    }
                    
                    appliedCoupon = coupon;
                    
                    // Increment usage count
                    coupon.usageCount += 1;
                    await coupon.save();
                }
            }
        }

        const finalPrice = totalPrice - discountAmount;

        // 3. إنشاء الطلب في قاعدة البيانات
        const order = new Order({
            user: auth.userId,
            orderItems,
            totalPrice: finalPrice, // Save final price
            shippingAddress,
            paymentMethod,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            discountAmount,
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


        if (paymentMethod === "Stripe") {
            if (!process.env.STRIPE_SECRET_KEY) {
                return NextResponse.json({ error: "Stripe is not configured. Check STRIPE_SECRET_KEY." }, { status: 500 });
            }
            
            let stripeDiscounts = [];
            if (discountAmount > 0) {
                try {
                    const stripeCoupon = await stripe.coupons.create({
                        amount_off: Math.round(discountAmount * 100),
                        currency: "usd",
                        duration: "once",
                        name: `Discount ${appliedCoupon?.code || 'Custom'}`
                    });
                    stripeDiscounts.push({ coupon: stripeCoupon.id });
                } catch (e) {
                    console.error("Error creating stripe coupon:", e);
                }
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: orderItems.map(item => ({
                    price_data: {
                        currency: "usd", // Defaulting to EGP, you can change to "usd"
                        product_data: {
                            name: item.name,
                            images: item.image && item.image.startsWith("http") ? [item.image] : [], // Stripe requires absolute URLs
                        },
                        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents/piasters
                    },
                    quantity: item.qty,
                })),
                mode: "payment",
                discounts: stripeDiscounts,
                success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/Cancel`,
                metadata: {
                    orderId: order._id.toString(),
                }
            });

            return NextResponse.json({ success: true, url: session.url });
        }

        return NextResponse.json({ error: "طريقة الدفع غير معتمدة. اختر Stripe أو COD." }, { status: 400 });

    } catch (error) {
        console.error("❌ Checkout API Error:", error);
        return NextResponse.json({ error: "حدث Error داخلي في الخادم" }, { status: 500 });
    }
}
