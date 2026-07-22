import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ message: "مفتاح الذكاء اNoصطناعي Out of Stock (GEMINI_API_KEY)" }, { status: 400 });
        }
        
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const user = await getAuthFromCookie();
        if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { title, category } = await req.json();

        if (!title) {
            return NextResponse.json({ message: "Product title is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `أنت خبير تسويق إلكتروني محترف.
اكتب وصف تسويقي جذاب واحترافي لمنتج يحمل اNoسم: "${title}" 
والتصنيف: "${category || 'عام'}".
الوصف يجب أن يكون باللغة العربية، ومقسم إلى فقرة قصيرة تلفت اNoنتباه، ثم قائمة بالنقاط (Bullets) لأهم المميزات.
No تكتب أي مقدمات أو خاتمة مثل "بالتأكيد" أو "إليك الوصف"، بل اكتب الوصف مباشرة.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ description: text }, { status: 200 });

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
