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
            qty: { type: Number, required: true }
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
        default: "Stripe",
        enum: ["Stripe", "COD"]
    },
    
    couponCode: {
        type: String,
        default: null
    },
    
    discountAmount: {
        type: Number,
        default: 0
    }
    
} , { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
 
export default Order; 