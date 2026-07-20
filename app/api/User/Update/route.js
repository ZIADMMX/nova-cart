import User from "@/model/User";
import connectToMongo from "@/lib/db";
import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";

// 📂 ملف المسار: app/api/user/update/route.js

export async function PUT(request) {
    try {
        // 1. هنا استقبلنا البيانات القادمة من المستخدم
        const body = await request.json(); 
        await connectToMongo();

        const loggedInUser = await getAuthFromCookie();
        if (!loggedInUser) {
            return NextResponse.json({ success: false, message: "غير مصرح لك" }, { status: 401 });
        }

        // ========================================================
        // 🎯 المـكـان الـدقـيـق والـصـحـيـح للأسـطـر هـنـا:
        // ========================================================
        const allowedUpdates = {};
        if (body.name) allowedUpdates.name = body.name;
        // ========================================================


        // 2. هنا نرسل الصندوق المفحوص والآمن فقط إلى قاعدة البيانات
        const updatedUser = await User.findByIdAndUpdate(
            loggedInUser.userId, 
            { $set: allowedUpdates }, // تم تمرير المتغير الآمن هنا
            { new: true, runValidators: true } 
        );

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (err) {
        console.error("❌ خطأ أثناء تحديث بيانات المستخدم: ", err);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 });
    }
}
