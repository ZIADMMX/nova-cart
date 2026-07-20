import { NextResponse } from "next/server";
import connectToMongo from "@/lib/db";
import Product from "@/model/Product";
import { getAuthFromCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit"; // 🚨 إضافة حماية السيرفر
import { GoogleGenerativeAI } from "@google/generative-ai";

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export async function POST(request) {
    try {
        // 🚨 حماية الـ API من الاستنزاف وهجمات البوتات (Cost Control & Security)
        const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
        const rateLimitResult = rateLimit(ip);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ message: 'لقد تجاوزت الحد المسموح من الرسائل. يرجى الانتظار.' }, { status: 429 });
        }

        // 1. التحقق من الهوية والصلاحيات
        const auth = await getAuthFromCookie();
        if (!auth) {
            return NextResponse.json({ message: "غير مصرح لك للوصول، يرجى تسجيل الدخول" }, { status: 401 });
        }

        const { message } = await request.json(); 
        if (!message || !message.trim()) {
            return NextResponse.json({ message: "Message is required" }, { status: 400 }); 
        }

        // 🚨 حماية من الرسائل الطويلة جداً التي تعطل الـ API أو تزيد التكلفة (Token Exhaustion)
        if (message.length > 100) {
            return NextResponse.json({ message: "الرسالة طويلة جداً، يرجى كتابة رسالة أقصر (بحد أقصى 100 حرف)" }, { status: 400 });
        }

        await connectToMongo(); 
        const cleanMessage = message.trim();
        const cleanMessageLower = cleanMessage.toLowerCase();
        
        // 2. معالجة رسائل الترحيب الأولية
        const greetingMessages = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "مرحبا", "مرحباً", "السلام عليكم", "هلا"]; 
        
        if (greetingMessages.includes(cleanMessageLower) || cleanMessageLower.length < 3) {
            return NextResponse.json({
                reply: "مرحباً بك! أنا مساعدك الذكي لمتجر NovaCart. كيف يمكنني مساعدتك في التسوق اليوم؟ يمكنك الاستفسار عن أي منتج أو فئة.",
                products: [],
                timestamp: new Date().toISOString()
            }); 
        }

        // 3. فلترة الكلمات واستخراج الكلمات المفتاحية للبحث في قاعدة البيانات
        const stopWords = ["buy", "order", "price", "look", "product", "cheap", "sale", "discount", "delivery", "shipping", "payment", "return", "refund", "cancel", "track", "search", "find", "get", "show", "list", "all", "available", "اريد", "شراء", "ابحث", "عن", "سعر", "منتج", "منتجات", "ابي", "عايز"]; 
        const words = cleanMessageLower.split(/\s+/);
        const keywords = words.filter(word => !stopWords.includes(word) && word.length > 1);

        // 4. بناء الاستعلام لجلب المنتجات ذات الصلة كـ Context للـ AI
        let query = { isActive: { $ne: false } }; // جلب المنتجات المتاحة

        if (keywords.length > 0) {
            const searchConditions = keywords.map((k) => {
                const escapedKeyword = escapeRegex(k);
                return {
                    $or: [
                        { title: { $regex: escapedKeyword, $options: "i" } },
                        { category: { $regex: escapedKeyword, $options: "i" } },
                        { description: { $regex: escapedKeyword, $options: "i" } },
                    ],
                };
            });
            query.$and = searchConditions;
        }

        // فلترة الأسعار التلقائية
        const priceMatch = cleanMessageLower.match(/(\d+)/);
        if (priceMatch) {
            const extractedPrice = Number(priceMatch[0]);
            if (cleanMessageLower.includes("under") || cleanMessageLower.includes("أقل") || cleanMessageLower.includes("اقل")) {
                query.price = { $lte: extractedPrice };
            } else if (cleanMessageLower.includes("over") || cleanMessageLower.includes("أعلى") || cleanMessageLower.includes("اكثر") || cleanMessageLower.includes("أكثر")) {
                query.price = { $gte: extractedPrice };
            }
        }

        // جلب المنتجات المتوافقة للـ Context
        const foundProducts = await Product.find(query)
            .select("title price description category imageUrl stock")
            .limit(6)
            .lean();

        // 5. محرك الـ AI: التوصيل مع Google Gemini إذا كان المفتاح متوفراً
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                // صياغة الـ Context الذكي لـ Gemini
                const productContext = foundProducts.map(p => 
                    `- Product: "${p.title}" | Category: "${p.category}" | Price: $${p.price} | Stock: ${p.stock} units | Description: "${p.description}"`
                ).join("\n");

                const systemPrompt = `You are a professional, helpful, and friendly AI Shopping Assistant for "NovaCart" e-commerce store.
Your goal is to guide customers, recommend products, and answer their shopping questions.
You must speak in the SAME language as the customer (Arabic or English).

Available Products Context from Database:
${productContext || "No products found matching the query in the database."}

Instructions:
1. If relevant products are available in the context, recommend them to the user. Explain why they fit the user's needs.
2. Do not hallucinate or recommend any products that are not present in the provided list.
3. If no products are found, politely suggest they search for other keywords or categories.
4. Be concise, polite, and persuasive. Avoid technical JSON formatting in your final response. Keep it conversational.
5. If the user asks general questions like "who are you" or "hi", introduce yourself and ask how you can help.

Customer query: "${cleanMessage}"`;

                const result = await model.generateContent(systemPrompt);
                const aiReply = result.response.text();
                    
                if (aiReply) {
                    return NextResponse.json({
                        reply: aiReply.trim(),
                        products: foundProducts,
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (aiError) {
                console.error("⚠️ Gemini API integration failed, falling back to local search:", aiError);
            }
        }

        // 6. الـ Fallback المحلي في حال عدم وجود API Key
        let reply = "";
        if (foundProducts.length === 0) {
            reply = `عذراً، لم أجد أي منتجات تطابق "${cleanMessage}" حالياً. هل تود البحث بكلمات مفتاحية أخرى؟`;
        } else {
            reply = `لقد وجدت لك هذه المنتجات المميزة لـ "${cleanMessage}" في متجرنا:`;
        }

        return NextResponse.json({
            reply,
            products: foundProducts,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("❌ Chatbot Route Error:", error); 
        return NextResponse.json({ message: "حدث خطأ داخلي في خادم المساعد الذكي" }, { status: 500 }); 
    } 
}
