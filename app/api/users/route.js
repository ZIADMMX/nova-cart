import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import User from "@/model/User";
import connectToMongo from "@/lib/db";

export async function GET(request) {
    try {
        // 1. التحقق من هوية الأدمن
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك للوصول لهذه البيانات" }, { status: 403 });
        }

        // 2. اNoتصال بقاعدة البيانات
        await connectToMongo();

        const { searchParams } = new URL(request.url);
        const pageVal = searchParams.get('page');

        if (pageVal) {
            const page = parseInt(pageVal) || 1;
            const limit = parseInt(searchParams.get('limit')) || 10;
            const skip = (page - 1) * limit;

            const total = await User.countDocuments({});
            const users = await User.find({})
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            return NextResponse.json({
                users,
                page,
                pages: Math.ceil(total / limit),
                total
            });
        }

        // 3. جلب جميع Users بدون حقل الباسورد المرتبين بالأحدث أوNoً
        const users = await User.find({})
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(users);
    } catch (err) {
        console.error("❌ Error أثناء جلب Users للأدمن: ", err);
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // لتغيير دور مستخدم (أدمن / مستخدم عادي)
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "super_admin" && auth.role !== "admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بEdit الأدوار" }, { status: 403 });
        }

        const { userId, role } = await request.json();
        if (!userId || !role) {
            return NextResponse.json({ success: false, message: "معرف المستخدم والدور الجديد مطلوبان" }, { status: 400 });
        }

        // منع الأدمن العادي من إعطاء رتبة سوبر أدمن
        if (auth.role === "admin" && role === "super_admin") {
            return NextResponse.json({ success: false, message: "No يمكنك تعيين مستخدم كسوبر أدمن" }, { status: 403 });
        }

        await connectToMongo();
        
        // منع الأدمن العادي من Edit السوبر أدمن الحالي
        if (auth.role === "admin") {
             const targetUser = await User.findById(userId);
             if (targetUser && targetUser.role === "super_admin") {
                 return NextResponse.json({ success: false, message: "No يمكنك Edit صNoحيات السوبر أدمن" }, { status: 403 });
             }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ success: false, message: "المستخدم غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error("❌ Error أثناء تحديث رتبة المستخدم: ", err);
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "super_admin" && auth.role !== "admin")) {
            return NextResponse.json({ success: false, message: "غير مصرح لك بحذف مستخدم" }, { status: 403 });
        }

        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ success: false, message: "معرف المستخدم مطلوب لحذفه" }, { status: 400 });
        }

        await connectToMongo();

        const targetUser = await User.findById(userId).select("role");
        if (!targetUser) {
            return NextResponse.json({ success: false, message: "المستخدم غير موجود" }, { status: 404 });
        }

        if (targetUser.role !== "user") {
            return NextResponse.json({ success: false, message: "يمكنك حذف المستخدمين العاديين فقط" }, { status: 403 });
        }

        await User.findByIdAndDelete(userId);

        return NextResponse.json({ success: true, message: "تم حذف المستخدم بنجاح" });
    } catch (err) {
        console.error("❌ Error أثناء حذف المستخدم: ", err);
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    }
}
