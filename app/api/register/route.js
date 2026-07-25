import { NextResponse } from "next/server";
import User from "@/model/User";
import connectToMongo from "@/lib/db";
import { createAuthCookie } from "@/lib/auth"; 
import { rateLimit } from "@/lib/rateLimit"; // 🚨 حماية من هجمات البوتات
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request) {
    try {
        // 🚨 حماية ضد هجمات إنشاء الحسابات الوهمية (Spam/Bots)
        const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
        const rateLimitResult = rateLimit(ip);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ success: false, message: 'تم حظر طلبك مؤقتاً بسبب كثرة المحاولات.' }, { status: 429 });
        }

        // 1. استقبال البيانات والتحقق من اكتمالها
        const { name, email, password } = await request.json();
        
        if (!name || !email || !password) {
            return NextResponse.json({ success: false, message: "البيانات غير مكتملة" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ success: false, message: "كلمة المرور يجب ألا تقل عن 6 أحرف" }, { status: 400 });
        }

        // 2. اNoتصال بقاعدة البيانات الآمن والمحمي بالكاش
        await connectToMongo();

        // 3. التحقق من عدم تكرار الحساب (الSearch صاروخي بسبب الفهرسة و الـ lowercase التلقائي)
        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ success: false, message: "المستخدم موجود بالفعل" }, { status: 400 });
        }

        // 4. إنشاء المستخدم (الإصNoح 2: تسمية المتغير بحروف صغيرة user لمنع التعارض مع الموديل)
        // الموديل سيقوم بتشفيير الباسورد تلقائياً بفضل الـ pre-save middleware المحكم الذي بنيناه
        const user = await User.create({ name, email, password }); 

        if (user) {
            // 5. زرع الكوكي الآمن في المتصفح تلقائياً (دالتك الجاهزة والمحترفة)
            await createAuthCookie(user._id.toString(), user.role);

            // 📩 إرسال رسالة الترحيب
            try {
                await sendWelcomeEmail(user.email, user.name);
            } catch (emailErr) {
                console.error("Failed to send welcome email:", emailErr);
            }

            // 6. إرجاع بيانات الحساب الجديد بSuccess للـ Frontend
            return NextResponse.json({
                success: true,
                message: "تم إنشاء الحساب بSuccess",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            });
        } else {
            return NextResponse.json({ success: false, message: "فشل في إنشاء الحساب، حاول مجدداً" }, { status: 400 });
        } 

    } catch (err) {
        console.error("❌ Error أثناء تسجيل المستخدم: ", err);
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message).join(", ");
            return NextResponse.json({ success: false, message: messages }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: "حدث Error في الخادم الداخلي" }, { status: 500 });
    } 
} 
