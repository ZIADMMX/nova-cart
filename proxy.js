import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/profile", "/cart", "/checkout", "/notifications", "/orders", "/order", "/chat"];

const secretKey = process.env.JWT_SECRET || "novacart_dev_secret_2026";
const secret = new TextEncoder().encode(secretKey);
const adminRoutes = ["/admin", "/dashboard"];
const superAdminRoutes = ["/superadmin"];
const authPaths = ["/auth/login", "/auth/register", "/auth/forget-password", "/auth/reset-password"];

// 🛠️ تحسين الأداء: تهيئة الـ Secret مرة واحدة خارج الدالة لكي لا يستهلك السيرفر مع كل Request

export default async function authMiddleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("jwt_token")?.value; 
    let User = null;

    // 1. فك تشفير التوكن وقراءة البيانات
    if (token) {
        try {
            const { payload } = await jwtVerify(token, secret);
            User = payload; 
        } catch (error) {
            console.log("إشعار: التوكن منتهي الصلاحية أو تالف");
            // 🛠️ أمان: مسح الكوكي التالفة فوراً وتوجيه المستخدم لتسجيل الدخول
            const response = NextResponse.redirect(new URL("/auth/login", req.url));
            response.cookies.delete("jwt_token");
            return response;
        } 
    } 

    // 2. منع المسجلين من دخول صفحات التسجيل
    if (User && authPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // 3. منع الزوار من دخول الصفحات المحمية
    if (!User && protectedRoutes.some((path) => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // 4. حماية مسارات الأدمن
    if (adminRoutes.some((path) => pathname.startsWith(path))) {
        if (!User || (User.role?.toLowerCase() !== "admin" && User.role?.toLowerCase() !== "super_admin")) {
            return NextResponse.redirect(new URL("/auth/login", req.url)); 
        }
    }

    // 5. حماية مسارات السوبر أدمن
    if (superAdminRoutes.some((path) => pathname.startsWith(path))) {
        if (!User || User.role?.toLowerCase() !== "super_admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    // 6. 🛠️ أمان سيبراني احترافي: إضافة Security Headers
    const response = NextResponse.next();
    
    // منع هجمات الـ Clickjacking (تضمين موقعك في iframe لسرقة النقرات)
    response.headers.set('X-Frame-Options', 'DENY');
    // منع المتصفح من تغيير نوع الملفات (MIME Sniffing)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // تفعيل حماية المتصفح ضد الـ XSS
    response.headers.set('X-XSS-Protection', '1; mode=block');
    // إجبار المتصفح على استخدام HTTPS دائماً
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return response;
}

export const config = {
    matcher: [
        '/order/:path*',
        '/orders/:path*',
        '/profile/:path*',
        '/cart/:path*',
        '/checkout/:path*',
        '/notifications/:path*',
        '/chat/:path*',
        '/admin/:path*',
        '/dashboard/:path*',
        '/superadmin/:path*',
        '/auth/:path*',
        // 🛠️ إضافة مسارات الـ API لتطبيق الـ Headers عليها 
        '/api/:path*',
    ]
};
