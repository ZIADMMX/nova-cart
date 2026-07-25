import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToMongo from "@/lib/db";
import Order from "@/model/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    const sig = req.headers.get("stripe-signature");

    let event;
    try {
        const rawBody = await req.text();
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
            try {
                await connectToMongo();
                const order = await Order.findById(orderId);
                
                if (order) {
                    order.status = "Paid";
                    order.paymentResult = {
                        id: session.id,
                        status: session.payment_status,
                        email_address: session.customer_details?.email || "",
                    };
                    await order.save();
                    console.log(`Order ${orderId} successfully marked as Paid via Stripe`);
                }
            } catch (err) {
                console.error("Error updating order in webhook:", err);
                return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
