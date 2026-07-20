import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import Order from "@/model/Order";
import { getAuthFromCookie } from "@/lib/auth";

export async function POST(request, context) {
    try {
        const params = await context.params;
        const id = params.id;
        const user = await getAuthFromCookie();

        if (!user) {
            return NextResponse.json({ message: "يرجى تسجيل الدخول أولاً لإضافة تقييم" }, { status: 401 });
        }

        const { rating, comment } = await request.json();

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ message: "يرجى إعطاء تقييم صحيح من 1 إلى 5 نجوم" }, { status: 400 });
        }
        if (!comment || comment.trim() === "") {
            return NextResponse.json({ message: "يرجى كتابة تعليق" }, { status: 400 });
        }

        await connectToMongo();

        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
        }

        // Check if user already reviewed
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === user.userId.toString()
        );

        if (alreadyReviewed) {
            return NextResponse.json({ message: "لقد قمت بتقييم هذا المنتج مسبقاً" }, { status: 400 });
        }

        // Check if user bought the product
        const hasBought = await Order.findOne({
            user: user.userId,
            "orderItems._id": id
        });

        if (!hasBought) {
            return NextResponse.json({ message: "عذراً، يجب شراء المنتج أولاً لتتمكن من تقييمه." }, { status: 400 });
        }

        const review = {
            user: user.userId,
            name: user.name || "مستخدم",
            rating: Number(rating),
            comment: comment.trim(),
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();

        return NextResponse.json({ message: "تمت إضافة التقييم بنجاح", product }, { status: 201 });
    } catch (error) {
        console.error("Review error:", error);
        return NextResponse.json({ message: "حدث خطأ أثناء حفظ التقييم" }, { status: 500 });
    }
}
