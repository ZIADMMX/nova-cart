import Product from "@/model/Product";
import connectToMongo from "@/lib/db";
import mongoose from "mongoose";

// دالة مدمجة في Next.js لإنشاء الـ Metadata ديناميكياً قبل تحميل الصفحة في المتصفح
export async function generateMetadata({ params }) {
    const { id } = await params;

    // التحقق من صحة المعرف حتى لا ينهار السيرفر
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { title: 'منتج غير صالح' };
    }

    try {
        await connectToMongo();
        const product = await Product.findById(id).select("title description imageUrl price currency").lean();

        if (!product) {
            return { title: 'المنتج غير موجود' };
        }

        const validImageUrl = product.imageUrl && product.imageUrl.startsWith("http") 
            ? product.imageUrl 
            : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

        // بناء وصف ذكي إذا لم يكن هناك وصف للمنتج
        const metaDesc = product.description || `احصل على ${product.title} الآن من NovaCart بسعر ${product.price} ${product.currency || 'ر.س'} فقط!`;

        return {
            title: product.title,
            description: metaDesc,
            openGraph: {
                title: product.title,
                description: metaDesc,
                images: [
                    {
                        url: validImageUrl,
                        width: 800,
                        height: 600,
                        alt: product.title,
                    }
                ],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: product.title,
                description: metaDesc,
                images: [validImageUrl],
            },
        };
    } catch (error) {
        return { title: 'NovaCart Product' };
    }
}

// هذه الـ Layout مجرد وعاء لتمرير الـ Metadata ولا تؤثر على الـ page.jsx (Client Component)
export default function ProductLayout({ children }) {
    return <>{children}</>;
}
