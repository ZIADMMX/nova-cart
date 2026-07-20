import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, // يفضل وضع trim هنا أيضاً لتنظيف مسافات الإيميل
        lowercase: true, // يحول الإيميل لحروف صغيرة دائماً لمنع تكرار الحسابات بسبب الحروف الكبيرة
        index: true // فهرس ذكي لجعل عملية تسجيل الدخول بلمح البصر
    },
    password: { type: String, required: true, minlength: 6, select: false, trim: true }, // التعديل: minlength وليس min للـ String
    role: { 
        type: String, 
        required: true, 
        default: "user", 
        enum: ["admin", "user", "super_admin"] 
    },
} , { timestamps: true }); 

// دالة التشفير التلقائي قبل الحفظ (متوافقة مع Mongoose 9+)
userSchema.pre("save" , async function() {
    if (!this.isModified("password")) return;
    
    // نمرر كلمة المرور الخام مباشرة مع قوة التشفير 12
    this.password = await bcrypt.hash(this.password, 12);
}); 

// دالة مقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.comparePassword = async function(candidatePassword) {
    // candidatePassword هي الكلمة التي كتبها المستخدم في الفورم، و this.password هي المشفرة المستدعاة من القاعدة
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User; 