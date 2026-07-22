const fs = require('fs');
const path = require('path');

const translations = {
    'العودة لإدارة Orders': 'Back to Orders Management',
    'فشل في Loading Order Details.': 'Failed to load Order Details.',
    'حدث Error غير متوقع أثناء اNoتصال بالخادم.': 'An unexpected error occurred while connecting to the server.',
    'حدث Error أثناء Edit الحالة': 'Error occurred while updating status',
    'فشل في تحديث الحالة': 'Failed to update status',
    'العودة لقائمة Orders': 'Back to Orders List',
    'Products المطلوبة': 'Requested Products',
    'المجموع الفرعي': 'Subtotal',
    'الShipping والتسليم': 'Shipping & Delivery',
    'مجاني': 'Free',
    'طريقة Checkout': 'Payment Method',
    'بطاقة ائتمان': 'Credit Card',
    'المجموع الكلي': 'Total Amount',
    'حساب المشتري': 'Buyer Account',
    'Shipping Address بالتفصيل': 'Detailed Shipping Address',
    'تم النسخ!': 'Copied!',
    'نسخ الكل': 'Copy All',
    'اسم المستلم': 'Recipient Name',
    'المحافظة': 'Region / State',
    'اسم الشارع': 'Street Name',
    'تفاصيل العنوان': 'Address Details',
    'No توجد معلومات Shipping مسجلة لهذا الطلب.': 'No shipping information recorded for this order.',
    'Edit الحالة': 'Edit Status',
    'غير محدد': 'Not specified',
    'جاري Loading': 'Loading',
    'حدث Error': 'Error occurred',
    'اNoتصال': 'Connection',
    'اNoنتظار': 'Pending',
    'الShipping': 'Shipping',
    'الملغي': 'Cancelled',
    'ملغي': 'Cancelled',
    'قيد التحضير': 'Processing',
    'تم Checkout': 'Paid',
    'Checkout عند اNoستNoم': 'Cash on Delivery',
    'اNoسم': 'Name',
    'الهاتف': 'Phone',
    'الشارع': 'Street',
    'العنوان': 'Address',
    'تعديل': 'Edit',
    'حذف': 'Delete',
    'إضافة': 'Add',
    'حفظ': 'Save',
    'إلغاء': 'Cancel',
    'تأكيد': 'Confirm',
    'نجاح': 'Success',
    'خطأ': 'Error',
    'تحميل': 'Loading',
    'بحث': 'Search',
    'المستخدمين': 'Users',
    'المنتجات': 'Products',
    'الطلبات': 'Orders',
    'الإعدادات': 'Settings',
    'لوحة التحكم': 'Dashboard',
    'مرحبا': 'Welcome',
    'تسجيل خروج': 'Logout'
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

const filesToProcess = getFiles(path.join(__dirname, 'app', 'dashboard'));

let totalReplaced = 0;

for (const file of filesToProcess) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    for (const [arabic, english] of Object.entries(translations)) {
        const escapedArabic = arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedArabic, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, english);
            changed = true;
        }
    }
    
    // Fallback for remaining Arabic characters in string literals (dangerous but effective if targeted)
    // We will just do a pass to replace obvious ones
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Translated UI in: ' + file);
        totalReplaced++;
    }
}

console.log('Finished secondary dashboard translation. Files updated: ' + totalReplaced);
