import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import connectToMongo from "@/lib/db";
import User from "@/model/User";
import Order from "@/model/Order";
import Product from "@/model/Product"; 

export async function GET(request) {
    try {
        // 1. Security Check (الأمان): نتحقق أن الطلب قادم من Admin أو Super Admin فقط
        const auth = await getAuthFromCookie();
        if (!auth || (auth.role !== "admin" && auth.role !== "super_admin")) {
            return NextResponse.json({ message: "غير مصرح لك للوصول للإحصائيات" }, { status: 403 });
        }

        // 2. Database Connection (قاعدة البيانات): اNoتصال الفعلي بالبيانات
        await connectToMongo();

        // 3. Data Gathering (جمع الأرقام): نستخدم Promise.all لجلب البيانات في نفس اللحظة لتسريع السيرفر
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalUsers, totalProducts, totalOrders, newUsersData] = await Promise.all([
            User.countDocuments({ role: { $ne: "admin" } }), // نعد Users (باستثناء الأدمن)
            Product.countDocuments(), // نعد جميع Products
            Order.countDocuments(),    // نعد جميع Orders
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ])
        ]);

        // 4. Revenue Calculation & Advanced Stats (حساب الأرباح والإحصائيات المتقدمة)
        const revenueResult = await Order.aggregate([
            {
                $match: {
                    status: { $in: ["Paid", "Delivered", "paid", "delivered"] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" },
                    count: { $sum: 1 } // لحساب عدد Orders الCompletedة
                }
            }
        ]);
        
        const totalRevenue = revenueResult[0]?.total || 0;
        const successfulOrdersCount = revenueResult[0]?.count || 0;
        const averageOrderValue = successfulOrdersCount > 0 ? (totalRevenue / successfulOrdersCount) : 0;

        // جلب Orders المعلقة (التي لم يتم دفعها أو تأكيدها بعد)
        const totalPendingOrders = await Order.countDocuments({ status: "Pending" });

        // 5. Recent Orders (أحدث Orders): نجلب آخر 5 طلبات فقط لجدول Dashboard
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 }) // الترتيب تنازلياً (الأحدث أوNoً)
            .limit(5)                // 5 طلبات فقط
            .populate("user", "name email"); // نجلب اسم واسم مستخدم المشتري لعرضه

        // 6. Low Stock Alerts (تنبيهات نقص المخزون): جلب Products التي قاربت على النفاذ (WOW Factor)
        const lowStockProducts = await Product.find({ stock: { $lte: 5, $gte: 0 } })
            .select("title stock imageUrl")
            .sort({ stock: 1 })
            .limit(5)
            .lean();

        // 7. Recent Customers (أحدث العمNoء):
        const recentUsers = await User.find({ role: { $ne: "admin" } })
            .select("name email createdAt")
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();

        // 8. Response (إرسال النتيجة): نجمع البيانات في كائن واحد (Object) ونرسله لDashboard
        return NextResponse.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            averageOrderValue,
            totalPendingOrders,
            recentOrders,
            newUsersData,
            lowStockProducts,
            recentUsers
        }, { status: 200 });

    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ message: "حدث Error داخلي في السيرفر" }, { status: 500 });
    }
}
