import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_NAME = "jwt_token"; // توحيد اسم الكوكي في متغير واحد منعاً للخطأ

// 1. دالة إنشاء الـ Token
export function signInToken(userId, role) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

// 2. دالة التحقق من الـ Token
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // يعود بـ null إذا انتهى الوقت أو تم التلاعب به
    }
}

// 3. دالة تجميع إعدادات الكوكي (بديلة لـ getCookieOptions)
function getCookieConfig() {
    return {
        httpOnly: true,
        sameSite: isProduction ? "strict" : "lax",
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60, // 7 أيام مطابقة تماماً للـ Token
        path: "/",
    };
}

// 4. دالة زرع الكوكي في المتصفح عند تسجيل الدخول
export async function createAuthCookie(userId, role) {
    const token = signInToken(userId, role);
    const cookieStore = await cookies();
    
    cookieStore.set(COOKIE_NAME, token, getCookieConfig());
}

// 5. دالة جلب وقراءة بيانات المستخدم من الكوكي لحماية الصفحات
export async function getAuthFromCookie() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    
    const decoded = verifyToken(token);
    if (decoded && decoded.role) {
        decoded.role = decoded.role.toLowerCase();
    }
    return decoded;
}


export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}