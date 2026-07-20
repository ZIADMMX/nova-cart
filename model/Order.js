import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // تم تنظيف التكرار وإبقاء الفهرس
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true 
    },
    
    orderItems: [
        { 
            product: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "Product", 
                required: true 
            },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            image: { type: String, required: true }, 
            qty: { type: Number, required: true },
            deliveredData: {
                downloadLink: { type: String },
                licenseKey: { type: String }
            }
        }, 
    ],
    
    totalPrice: { type: Number, default: 0 },
    
    shippingAddress: {
        fullName: { type: String },
        phone: { type: String },
        address: { type: String },
        streetName: { type: String },
        city: { type: String },
        postalCode: { type: String, default: "" },
    },
    
    // وضع قيود صارمة لحالات الطلب منعاً للأخطاء البرمجية
    status: { 
        type: String, 
        default: "Pending", 
        enum: ["Pending", "Processing", "Paid", "Shipped", "Delivered", "Cancelled"] 
    }, 
    
    paymentResult: {
        id: { type: String, default: "" }, 
        status: { type: String, default: "" },
        email_address: { type: String, default: "" },
    },
    
    paymentMethod: {
        type: String,
        default: "Card",
        enum: ["Card", "COD"]
    },
    
    // إزالة required لمنع توقف السيرفر عند بداية عملية الدفع، مع الحفاظ على sparse للفهرسة الفريدة لاحقاً
    stripeSessionId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    paymobOrderId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    
} , { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
 
export default Order; 