import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ success: false, message: "لم يتم تحميل أي ملف" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // إنشاء مسار الحفظ في المجلد public/uploads
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        
        // التأكد من وجود المجلد
        await mkdir(uploadDir, { recursive: true });

        // توليد اسم فريد للملف
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.name) || ".png";
        const filename = `${uniqueSuffix}${fileExtension}`;
        const filePath = path.join(uploadDir, filename);

        // حفظ الملف
        await writeFile(filePath, buffer);

        // إرجاع المسار النسبي الذي يمكن للمتصفح الوصول إليه
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error("❌ خطأ أثناء رفع الملف:", error);
        return NextResponse.json({ success: false, message: "حدث خطأ أثناء رفع الملف" }, { status: 500 });
    }
}
