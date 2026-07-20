import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import connectDB from "@/lib/db";
import Order from "@/model/Order";
import Product from "@/model/Product";

export async function GET(req) {
    try {
        await connectDB();
        
        const user = await getAuthFromCookie();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const orderId = url.searchParams.get("orderId");
        const productId = url.searchParams.get("productId");

        if (!orderId || !productId) {
            return NextResponse.json({ message: "Missing orderId or productId" }, { status: 400 });
        }

        // Verify order ownership and status
        const order = await Order.findOne({ _id: orderId, user: user.userId });
        
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        if (!["Paid", "Shipped", "Delivered"].includes(order.status)) {
            return NextResponse.json({ message: "Order not paid" }, { status: 403 });
        }

        // Find the specific item in the order
        const orderItem = order.orderItems.find(item => item.product.toString() === productId);
        if (!orderItem) {
            return NextResponse.json({ message: "Product not in this order" }, { status: 404 });
        }

        // Look for downloadLink in deliveredData first, otherwise fallback to Product model
        let downloadUrl = orderItem.deliveredData?.downloadLink;
        
        if (!downloadUrl) {
            const product = await Product.findById(productId);
            if (!product || product.productType !== 'digital_file') {
                return NextResponse.json({ message: "Product is not downloadable" }, { status: 404 });
            }
            downloadUrl = product.downloadUrl;
        }

        if (!downloadUrl) {
            return NextResponse.json({ message: "Download link not available" }, { status: 404 });
        }

        // Fetch file from the real URL and stream it to the user without exposing the URL
        const fileResponse = await fetch(downloadUrl);
        if (!fileResponse.ok) {
            return NextResponse.json({ message: "Failed to retrieve the file" }, { status: 500 });
        }

        const headers = new Headers();
        headers.set("Content-Type", fileResponse.headers.get("content-type") || "application/octet-stream");
        // Extract filename from URL or use a default one
        const fileName = downloadUrl.split('/').pop() || 'downloaded-file';
        headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

        return new NextResponse(fileResponse.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("Download Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
