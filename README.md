# NovaCart - Professional E-Commerce Platform

NovaCart is a high-performance, modern e-commerce platform built with Next.js 14+ (App Router) and MongoDB. It offers a seamless shopping experience with a robust administrative backend.

## Features

- **User Authentication:** Secure login and registration using custom JWT implementation.
- **Admin Dashboard:** Comprehensive dashboard for managing users, products, orders, and site settings.
- **Order Management:** Track and update order statuses easily.
- **Payment Integration:** Secure checkout via Stripe and Cash on Delivery (COD) support.
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop devices.
- **SEO Optimized:** Dynamic Meta tags and OpenGraph support built-in.

## Requirements

- Node.js 20+
- MongoDB

## Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy the `.env.example` file to `.env.local` and configure your credentials.

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_URL=https://nova-cart-lake.vercel.app
   STRIPE_SECRET_KEY=your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   EMAIL_USER=your_smtp_email
   EMAIL_PASS=your_smtp_password
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## Production Deployment Notes

Before deploying the project to a live environment (e.g., Vercel, VPS), ensure:
- The `NEXT_PUBLIC_URL` matches your actual production domain.
- `JWT_SECRET` is strong and securely stored.
- Stripe webhook is configured correctly on the Stripe Dashboard.
- Your MongoDB Atlas IP Access List includes the production server IP (or `0.0.0.0/0` for Vercel).