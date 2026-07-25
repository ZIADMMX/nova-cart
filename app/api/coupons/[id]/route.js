import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/model/Coupon';
import { getAuthFromCookie } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth || !auth.userId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(auth.role)) return NextResponse.json({ message: 'Not authorized as admin' }, { status: 403 });

    await connectDB();
    const { id } = params;
    const body = await request.json();

    const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!coupon) return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });

    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating coupon' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth || !auth.userId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(auth.role)) return NextResponse.json({ message: 'Not authorized as admin' }, { status: 403 });

    await connectDB();
    const { id } = params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting coupon' }, { status: 400 });
  }
}
