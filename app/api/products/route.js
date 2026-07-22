import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/model/Product';
import User from '@/model/User';
import { getAuthFromCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

// 🚨 وظيفة أمنية: تنظيف المدخNoت لمنع هجمات ReDoS 
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
    const rateLimitResult = rateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: 'لقد تجاوزت الحد المسموح. يرجى اNoنتظار دقيقة.' }, { status: 429 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    // 🚨 تنظيف الكلمة المفتاحية قبل إرسالها لقاعدة البيانات
    const safeKeyword = keyword ? escapeRegExp(keyword) : '';

    const query = safeKeyword
      ? {
          title: { $regex: safeKeyword, $options: 'i' },
          isActive: true,
        }
      : {
          isActive: true,
        };

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json(
      { message: 'حدث Error داخلي في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
    const rateLimitResult = rateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: 'لقد تجاوزت الحد المسموح. يرجى اNoنتظار دقيقة.' }, { status: 429 });
    }

    const auth = await getAuthFromCookie();

    if (!auth || !auth.userId) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401 }
      );
    }

    await connectDB();

    if (!['admin', 'super_admin'].includes(auth.role)) {
      return NextResponse.json(
        { message: 'Not authorized as admin' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      price,
      currency,
      category,
      imageUrl,
      stock,
      isActive,
    } = await request.json();

    // 🚨 التحقق من صحة البيانات الأساسية قبل الSave (Data Validation)
    if (!title || typeof price !== 'number' || price < 0 || stock < 0) {
      return NextResponse.json({ message: "بيانات المنتج غير صالحة" }, { status: 400 });
    }

    const product = await Product.create({
      title,
      description,
      price,
      currency,
      category,
      imageUrl,
      stock,
      isActive,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST Product Error:", error);
    return NextResponse.json(
      { message: 'حدث Error أثناء إضافة المنتج، يرجى مراجعة البيانات المدخلة' },
      { status: 400 }
    );
  }
}
