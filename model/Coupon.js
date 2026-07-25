import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    type: { 
        type: String, 
        required: true,
        enum: ['percentage', 'fixed', 'free_shipping'],
        default: 'percentage'
    },
    value: { 
        type: Number, 
        required: true,
        default: 0 
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    usageLimit: { 
        type: Number, 
        default: null // null means unlimited
    },
    usageCount: { 
        type: Number, 
        default: 0 
    },
    minOrderAmount: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default Coupon;
