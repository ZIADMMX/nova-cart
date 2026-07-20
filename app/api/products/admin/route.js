import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/model/Product';
import { getAuthFromCookie } from '@/lib/auth';

// 🛠️ إجبار Next.js على جلب البيانات الحية دائماً ومنع تخزينها (Caching) لأنها لوحة تحكم
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const auth = await getAuthFromCookie();

    if (!auth) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    if (!['admin', 'super_admin'].includes(auth.role)) {
      return NextResponse.json({ message: 'Not authorized as admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pageVal = searchParams.get('page');
    
    if (pageVal) {
      const page = parseInt(pageVal) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;
      const skip = (page - 1) * limit;
      
      const total = await Product.countDocuments({});
      const products = await Product.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
      return NextResponse.json({
        products,
        page,
        pages: Math.ceil(total / limit),
        total
      });
    }

    // استخدام lean() هي ممارسة ممتازة منك لتسريع الأداء!
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(products);
  } catch (error) {
    // 🛠️ أمان سيبراني: تسجيل الخطأ الحقيقي في السيرفر فقط لمراقبته
    console.error("Admin Products API Error:", error);

    // 🛠️ أمان سيبراني: إرسال رسالة عامة للمستخدم لمنع تسريب تفاصيل الداتا بيز للمخترقين
    return NextResponse.json(
      { message: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
