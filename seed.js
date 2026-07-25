/**
 * NovaCart - Database Seed Script
 * ---------------------------------
 * Populates the database with sample products, a test coupon,
 * and a demo admin user for the CodeCanyon live demo.
 *
 * Usage: npm run seed
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.local") });

// ─── Inline Schemas ───────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: { type: String, default: "user" } });
const productSchema = new mongoose.Schema({ title: String, description: String, price: Number, imageUrl: String, category: String, stock: Number, isActive: { type: Boolean, default: true } });
const couponSchema = new mongoose.Schema({ code: String, type: String, value: Number, expiryDate: Date, isActive: Boolean, usageLimit: Number, usageCount: { type: Number, default: 0 }, minOrderAmount: { type: Number, default: 0 } });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const PRODUCTS = [
    {
        title: "Premium Wireless Headphones",
        description: "Experience crystal-clear audio with our premium noise-cancelling wireless headphones. 40-hour battery life, comfortable over-ear design, and studio-quality sound.",
        price: 99.99,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
        category: "Electronics",
        stock: 50,
        isActive: true,
    },
    {
        title: "Mechanical Gaming Keyboard",
        description: "RGB backlit mechanical keyboard with tactile blue switches. Perfect for gaming and professional typing. USB-C connection.",
        price: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop",
        category: "Electronics",
        stock: 35,
        isActive: true,
    },
    {
        title: "4K Webcam Pro",
        description: "Ultra-sharp 4K webcam with built-in ring light and AI-powered background blur. Perfect for meetings, streaming, and content creation.",
        price: 129.99,
        imageUrl: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&auto=format&fit=crop",
        category: "Electronics",
        stock: 20,
        isActive: true,
    },
    {
        title: "Smart LED Desk Lamp",
        description: "Touch-controlled LED desk lamp with adjustable color temperature and brightness levels. USB charging port built-in. Eye-care technology.",
        price: 39.99,
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop",
        category: "Home & Office",
        stock: 80,
        isActive: true,
    },
    {
        title: "Ergonomic Office Chair",
        description: "Lumbar support, adjustable armrests, and breathable mesh back. Designed to keep you comfortable during long work sessions.",
        price: 249.99,
        imageUrl: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&auto=format&fit=crop",
        category: "Home & Office",
        stock: 15,
        isActive: true,
    },
    {
        title: "Portable Bluetooth Speaker",
        description: "360-degree surround sound, IPX7 waterproof rating, and 24-hour playtime. The perfect outdoor companion.",
        price: 49.99,
        imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop",
        category: "Electronics",
        stock: 60,
        isActive: true,
    },
    {
        title: "Minimalist Leather Wallet",
        description: "Slim RFID-blocking leather wallet. Holds up to 8 cards and cash. Available in black and brown.",
        price: 24.99,
        imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop",
        category: "Accessories",
        stock: 120,
        isActive: true,
    },
    {
        title: "Stainless Steel Water Bottle",
        description: "Double-wall insulated bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, leak-proof lid.",
        price: 19.99,
        imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop",
        category: "Home & Office",
        stock: 200,
        isActive: true,
    },
];

const COUPONS = [
    {
        code: "WELCOME20",
        type: "percentage",
        value: 20,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true,
        usageLimit: null, // unlimited
        minOrderAmount: 0,
    },
    {
        code: "SAVE25",
        type: "fixed",
        value: 25,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
        usageLimit: 50,
        minOrderAmount: 100,
    },
    {
        code: "FREESHIP",
        type: "free_shipping",
        value: 0,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        isActive: true,
        usageLimit: null,
        minOrderAmount: 0,
    },
];

const ADMIN_USER = {
    name: "Store Admin",
    email: "admin@novacart.demo",
    password: "Admin@123456",
    role: "super_admin",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error("❌ ERROR: MONGODB_URI is not set in .env.local");
        process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected!\n");

    // ── Products ──
    console.log("🗑️  Clearing existing products...");
    await Product.deleteMany({});
    console.log("📦 Inserting sample products...");
    const insertedProducts = await Product.insertMany(PRODUCTS);
    console.log(`   ✅ ${insertedProducts.length} products inserted.\n`);

    // ── Coupons ──
    console.log("🗑️  Clearing existing coupons...");
    await Coupon.deleteMany({});
    console.log("🎟️  Inserting sample coupons...");
    const insertedCoupons = await Coupon.insertMany(COUPONS);
    console.log(`   ✅ ${insertedCoupons.length} coupons inserted.`);
    console.log("   🏷️  Coupon codes: WELCOME20 (20% off), SAVE25 ($25 off min $100), FREESHIP (free shipping)\n");

    // ── Admin User ──
    const existingAdmin = await User.findOne({ email: ADMIN_USER.email });
    if (existingAdmin) {
        console.log("👤 Demo admin user already exists. Skipping.\n");
    } else {
        console.log("👤 Creating demo admin user...");
        const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);
        await User.create({ ...ADMIN_USER, password: hashedPassword });
        console.log("   ✅ Admin user created.");
        console.log(`   📧 Email: ${ADMIN_USER.email}`);
        console.log(`   🔑 Password: ${ADMIN_USER.password}\n`);
    }

    console.log("🎉 Seed completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    mongoose.disconnect();
    process.exit(1);
});
