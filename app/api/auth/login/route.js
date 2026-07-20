import User from "@/model/User";
import connectToMongo from "@/lib/db"; 
import { NextResponse } from "next/server";
import { createAuthCookie } from "@/lib/auth"; 
import { rateLimit } from "@/lib/rateLimit"; // 🚨 إضافة الجدار الناري

export async function POST(request) {
    try {
        // 🚨 حماية ضد الهجمات العنيفة (Brute Force) وتخمين الباسورد
        const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
        const rateLimitResult = rateLimit(ip);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ success: false, message: 'لقد تجاوزت عدد المحاولات المسموحة. يرجى المحاولة لاحقاً.' }, { status: 429 });
        }

        // 1. استقبال البيانات وتأمين الاتصال بقاعدة البيانات
        const { email, password } = await request.json();
        
        if (!email || !password) {
            return NextResponse.json({ success: false, message: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
        }

        await connectToMongo(); // استخدام الدالة الموحدة والمحمية بالكاش
         
        // 2. البحث عن المستخدم (ونجلب حقل الـ password يدوياً لأنه محجوب بـ select: false)
        const user = await User.findOne({ email }).select("+password");

        // 3. التحقق من وجود المستخدم ومطابقة كلمة المرور المشفرة (تم إصلاح اسم الدالة لـ comparePassword)
        if (user && (await user.comparePassword(password))) {
            
            // 4. زرع الكوكي الآمن في المتصفح تلقائياً (دالتك الجاهزة من ملف auth)
            await createAuthCookie(user._id.toString(), user.role);

            // 5. إرجاع بيانات المستخدم للـ Frontend (بدون كلمة المرور بالتأكيد!)
            return NextResponse.json({
                success: true,
                _id: user._id,  
                name: user.name,
                email: user.email,
                role: user.role,
            });
            
        } else {
            // أمنياً: يفضل دائماً قول "إيميل أو كلمة مرور خاطئة" دون تحديد أيهما الخاطئ لحماية الحسابات من التخمين
            return NextResponse.json({ success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
        } 

    } catch (err) {
        console.error("❌ خطأ أثناء تسجيل الدخول: ", err);
        return NextResponse.json({ success: false, message: "حدث خطأ في الخادم الداخلي" }, { status: 500 });
    }
}
