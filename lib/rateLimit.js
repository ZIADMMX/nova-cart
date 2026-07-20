// Rate Limiter - بيحدد عدد الـ requests المسموح بيها لكل IP
//
// إزاي بيشتغل:
// 1. كل IP بنحفظله عداد (counter) و وقت أول request
// 2. لو العداد وصل للحد المسموح → نرفض الـ request
// 3. لو الوقت عدى → نصفر العداد ونبدأ من الأول

// الدفتر - بيحفظ بيانات كل IP
const rateLimitMap = new Map();

// الإعدادات
const WINDOW_MS = 60 * 1000;  // النافذة الزمنية: دقيقة واحدة
const MAX_REQUESTS = 15;       // أقصى عدد requests في الدقيقة

/**
 * بيتشيك لو الـ IP ده تعدى الحد المسموح
 * @param {string} ip - الـ IP بتاع اللي بعت الـ request
 * @returns {{ allowed: boolean, remaining: number }} 
 */ 
export function rateLimit(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    // أول مرة يبعت request؟ سجله في الدفتر
    if (!record) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    // الدقيقة خلصت؟ صفر العداد وابدأ من الأول
    if (now - record.startTime > WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    // لسه في نفس الدقيقة - زود العداد
    record.count++;

    // تعدى الحد؟ ارفض!
    if (record.count > MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

// تنظيف الدفتر كل 5 دقايق عشان الذاكرة متمتلاش
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
        if (now - record.startTime > WINDOW_MS) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);
