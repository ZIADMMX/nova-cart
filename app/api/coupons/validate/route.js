import Coupon from "@/model/Coupon";
import mongoose from "mongoose";

export async function POST(req) {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const body = await req.json();
        const { couponCode, orderAmount } = body;

        if (!couponCode) {
            return new Response(JSON.stringify({ error: "Coupon code is required" }), { status: 400 });
        }

        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

        if (!coupon) {
            return new Response(JSON.stringify({ error: "Invalid or inactive coupon code" }), { status: 404 });
        }

        if (new Date() > new Date(coupon.expiryDate)) {
            return new Response(JSON.stringify({ error: "Coupon has expired" }), { status: 400 });
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return new Response(JSON.stringify({ error: "Coupon usage limit has been reached" }), { status: 400 });
        }

        if (orderAmount && coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
            return new Response(JSON.stringify({ error: `Minimum order amount of ${coupon.minOrderAmount} required` }), { status: 400 });
        }

        return new Response(JSON.stringify({
            success: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value
            }
        }), { status: 200 });

    } catch (error) {
        console.error("Error validating coupon:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
