import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/model/Coupon';
import { getAuthFromCookie } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await getAuthFromCookie();

    if (!auth || !auth.userId) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    if (!['admin', 'super_admin'].includes(auth.role)) {
      return NextResponse.json({ message: 'Not authorized as admin' }, { status: 403 });
    }

    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET Coupons Error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthFromCookie();

    if (!auth || !auth.userId) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    if (!['admin', 'super_admin'].includes(auth.role)) {
      return NextResponse.json({ message: 'Not authorized as admin' }, { status: 403 });
    }

    await connectDB();

    const {
      code,
      type,
      value,
      expiryDate,
      isActive,
      usageLimit,
      minOrderAmount
    } = await request.json();

    if (!code || !type || value === undefined || !expiryDate) {
      return NextResponse.json({ message: "Invalid coupon data" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
        return NextResponse.json({ message: "Coupon code already exists" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value: Number(value),
      expiryDate: new Date(expiryDate),
      isActive: isActive !== undefined ? isActive : true,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("POST Coupon Error:", error);
    return NextResponse.json({ message: 'Error adding coupon' }, { status: 400 });
  }
}
