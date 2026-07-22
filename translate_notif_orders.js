const fs = require('fs');
const path = require('path');

const filePaths = [
    'c:\\Users\\ziad\\novacart\\app\\notifications\\page.jsx',
    'c:\\Users\\ziad\\novacart\\app\\Orders\\page.jsx'
];

const dict = {
    'فشل في Loading الNotifications، يرجى المحاولة Noحقاً.': 'Failed to load notifications, please try again later.',
    'فشل في تحديث حالة الإشعار بالسيرفر.': 'Failed to update notification status on server.',
    'Error أثناء تحديث حالة الإشعار:': 'Error while updating notification status:',
    'جاري Loading صندوق الNotifications...': 'Loading notifications inbox...',
    'مركز الNotifications': 'Notifications Center',
    'تابع تحديثات طلباتك وعروضنا أوNoً بأول': 'Keep track of your orders and our latest offers',
    'صندوق الNotifications فارغ': 'Notifications inbox is empty',
    'ليست هناك أي تنبيهات أو رسائل مسجلة لك حالياً.': 'There are no alerts or messages recorded for you right now.',
    
    'فشل في Loading Orders من الخادم.': 'Failed to load orders from server.',
    'حدث Error أثناء Loading Orders.': 'Error occurred while loading orders.',
    'حدث Error غير متوقع.': 'An unexpected error occurred.',
    'قيد اNoنتظار': 'Pending',
    'قيد المعالجة': 'Processing',
    'تم Checkout': 'Paid',
    'تم الShipping': 'Shipped',
    'ملغي': 'Cancelled',
    'العودة للرئيسية': 'Back to Home',
    'جاري Loading طلباتك...': 'Loading your orders...',
    'إعادة المحاولة': 'Retry',
    'No توجد طلبات بعد': 'No orders yet',
    'يبدو أنك لم تقم بأي عملية شراء حتى الآن.': 'It seems you haven\'t made any purchases yet.',
    'تصفح Products الآن': 'Browse Products Now',
    'رقم الطلب:': 'Order ID:',
    'تاريخ الطلب:': 'Order Date:',
    'سعر الوحدة:': 'Unit Price:',
    'تفاصيل Shipping الطلب:': 'Order Shipping Details:',
    '👤 المستلم:': '👤 Recipient:',
    '📞 الهاتف:': '📞 Phone:',
    '📍 العنوان:': '📍 Address:',
};

for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
        console.error('File not found: ' + filePath);
        continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [ar, en] of Object.entries(dict)) {
        content = content.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), en);
    }
    
    // extra dynamic dates fix in Orders/page.jsx (ar-EG to en-US)
    if (filePath.includes('Orders')) {
        content = content.replace(/"ar-EG"/g, '"en-US"');
    }
    if (filePath.includes('notifications')) {
        content = content.replace(/"ar-EG"/g, '"en-US"');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Translated: ' + filePath);
}
