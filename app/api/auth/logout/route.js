import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request) {
    await clearAuthCookie();
    return NextResponse.json({ success: true, message: "تم تسجيل الLogout بSuccess" });
}
