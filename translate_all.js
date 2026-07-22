const fs = require('fs');
const path = require('path');

const translations = {
    'العودة للمنتجات': 'Return to Products',
    'الصفحة الرئيسية': 'Home',
    'الرئيسية': 'Home',
    'تسجيل الدخول': 'Sign In',
    'تسجيل الدخول / إنشاء حساب': 'Sign In / Sign Up',
    'إنشاء حساب': 'Sign Up',
    'حسابي': 'My Account',
    'الطلبات': 'Orders',
    'طلباتي': 'My Orders',
    'لوحة التحكم': 'Dashboard',
    'المنتجات': 'Products',
    'المستخدمين': 'Users',
    'الإعدادات': 'Settings',
    'خروج': 'Logout',
    'تسجيل خروج': 'Logout',
    'عربة التسوق': 'Shopping Cart',
    'سلة المشتريات': 'Shopping Cart',
    'السلة فارغة': 'Your cart is empty',
    'إضافة للسلة': 'Add to Cart',
    'متابعة التسوق': 'Continue Shopping',
    'الدفع': 'Checkout',
    'تأكيد الدفع': 'Confirm Payment',
    'إجمالي': 'Total',
    'الإجمالي': 'Total',
    'الكمية': 'Quantity',
    'السعر': 'Price',
    'اسم المستخدم': 'Name',
    'البريد الإلكتروني': 'Email',
    'كلمة المرور': 'Password',
    'نسيت كلمة المرور؟': 'Forgot Password?',
    'ليس لديك حساب؟': 'Don\'t have an account?',
    'لديك حساب بالفعل؟': 'Already have an account?',
    'جاري التحميل': 'Loading',
    'تحميل': 'Loading',
    'بحث': 'Search',
    'لا توجد منتجات': 'No products found',
    'تم الإضافة بنجاح': 'Added successfully',
    'خطأ': 'Error',
    'نجاح': 'Success',
    'حفظ': 'Save',
    'تعديل': 'Edit',
    'حذف': 'Delete',
    'إلغاء': 'Cancel',
    'نعم': 'Yes',
    'لا': 'No',
    'عرض التفاصيل': 'View Details',
    'تفاصيل الطلب': 'Order Details',
    'حالة الطلب': 'Order Status',
    'معلومات الشحن': 'Shipping Info',
    'عنوان الشحن': 'Shipping Address',
    'المدينة': 'City',
    'رقم الهاتف': 'Phone Number',
    'الرمز البريدي': 'Zip Code',
    'طريقة الدفع': 'Payment Method',
    'الدفع عند الاستلام': 'Cash on Delivery',
    'ادفع الآن': 'Pay Now',
    'مكتمل': 'Completed',
    'قيد الانتظار': 'Pending',
    'ملغى': 'Cancelled',
    'شحن': 'Shipping',
    'تم الشحن': 'Shipped',
    'تم التوصيل': 'Delivered',
    'تفاصيل المنتج': 'Product Details',
    'تقييمات': 'Reviews',
    'أضف تقييمك': 'Add your review',
    'لا توجد تقييمات بعد': 'No reviews yet',
    'سعر مخفض': 'Discounted Price',
    'متوفر في المخزون': 'In Stock',
    'غير متوفر': 'Out of Stock',
    'اللون': 'Color',
    'المقاس': 'Size',
    'تأكيد الشراء': 'Confirm Purchase',
    'عنصر': 'Item',
    'عناصر': 'Items',
    'اشترِ الآن': 'Buy Now',
    'متابعة الدفع': 'Proceed to Checkout',
    'عرض الكل': 'View All',
    'إشعارات': 'Notifications',
    'لا توجد إشعارات': 'No notifications',
    'تعليم كقرئ': 'Mark all as read',
    'تم إلغاء عملية الشراء': 'Purchase Cancelled',
    'فشل التحقق من الدفع!': 'Payment Verification Failed!',
    'عذراً، لم نتمكن من تأكيد عملية الدفع الخاصة بك': 'Sorry, we could not confirm your payment',
    'تم التحقق من الطلب بنجاح!': 'Order Verified Successfully!',
    'معرف الطلب:': 'Order ID:',
    'الذهاب للطلبات': 'Go to Orders',
    'الذهاب للسلة': 'Go to Cart',
    'الذهاب للرئيسية': 'Go to Home',
    'تأكيد كلمة المرور': 'Confirm Password',
    'رقم الموبايل': 'Mobile Number',
    'دخول': 'Login',
    'سجل الآن': 'Register Now',
    'تأكيد الطلب': 'Confirm Order',
    'تم إضافة المنتج للسلة': 'Product added to cart',
    'حدث خطأ ما': 'Something went wrong',
    'برجاء المحاولة مرة أخرى': 'Please try again',
    'مرحباً بك مجدداً': 'Welcome Back',
    'أدخل بياناتك للوصول لحسابك': 'Enter your details to access your account',
    'تسجيل حساب جديد': 'Create new account',
    'انضم إلينا واستمتع بتجربة تسوق مميزة': 'Join us for an amazing shopping experience',
    'جاري تسجيل الدخول...': 'Signing in...',
    'جاري التسجيل...': 'Registering...'
};

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
                getFiles(filePath, fileList);
            }
        } else {
            if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

const filesToProcess = getFiles(path.join(__dirname, 'app')).concat(getFiles(path.join(__dirname, 'components')));

let totalReplaced = 0;

for (const file of filesToProcess) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    for (const [arabic, english] of Object.entries(translations)) {
        // Escape special regex characters in the arabic string just in case
        const escapedArabic = arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedArabic, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, english);
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Translated UI in: ' + file);
        totalReplaced++;
    }
}

console.log('Finished translation. Files updated: ' + totalReplaced);
