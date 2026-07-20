import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import User from "@/model/User";
import connectToMongo from "@/lib/db";
export async function GET(request) {
    try {
        const auth = await getAuthFromCookie();
        if (!auth || !auth.userId ) {
            return NextResponse.json({ success: false, message: "غير مصرح لك" }, { status: 401 });
        }
        await connectToMongo();
        const user = await User.findById(auth.userId); 
        if(user){
            return NextResponse.json({_id:user._id, name:user.name,email:user.email ,role:user.role});
        }else{
            return NextResponse.json({message:"no user found"} , {status: 404});
        }  
        } catch (err) {
            console.error("❌ خطأ أثناء جلب بيانات المستخدم: ", err);
            return NextResponse.json({ success: false, message: "حدث خطأ في الخادم الداخلي" }, { status: 500});
        } 
} 
