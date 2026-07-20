import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import connectToMongo from "@/lib/db";
import User from "@/model/User"; 
import Product from "@/model/Product"; 
import Order from "@/model/Order"; 


export async function GET(request) {
    try { 
        const auth = await getAuthFromCookie();
        if(!auth || !["admin", "super_admin"].includes(auth.role)) return NextResponse.json({message:"unauthorized"} , {status: 403});
        await connectToMongo();
        const totalUsers = await User.countDocuments({role: "user"}); 

        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        const paidOrders =  await Order.find({status: { $in: ["Paid", "Delivered"] }}); 
        const  totalRevenue = paidOrders.reduce((acc,order)=> acc + (order.totalPrice || 0), 0);   
        const recentOrders = await Order.find()
            .sort({createdAt: -1}).limit(5).populate("user", "name email");
        
        return NextResponse.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            recentOrders
        }, {status: 200}); 

    } catch (error) {
        console.log(error);
        return NextResponse.json({message:"something went wrong"} , {status: 500}); 
    }  
}
