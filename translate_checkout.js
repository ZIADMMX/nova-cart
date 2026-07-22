const fs = require('fs');

const filePath = 'c:\\Users\\ziad\\novacart\\app\\checkout\\page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Governorates
content = content.replace(
    /const EGYPT_GOVERNORATES = \[([\s\S]*?)\];/,
    `const EGYPT_GOVERNORATES = [
    "Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", 
    "Sharqia", "Monufia", "Gharbia", "Beheira", "Damietta", 
    "Port Said", "Ismailia", "Suez", "Kafr El Sheikh", "Faiyum", 
    "Beni Suef", "Minya", "Asyut", "Sohag", "Qena", 
    "Luxor", "Aswan", "Red Sea", "New Valley", "Matrouh", 
    "North Sinai", "South Sinai"
];`
);

const dict = {
    'يرجى إدخال اNoسم بالكامل': 'Please enter your full name',
    'يرجى إدخال Phone Number': 'Please enter your phone number',
    'يرجى إدخال رقم هاتف مصري صحيح \\(مثال: 01012345678\\)': 'Please enter a valid phone number (e.g., 01012345678)',
    'يرجى اختيار المحافظة': 'Please select a governorate',
    'يرجى إدخال اسم الشارع': 'Please enter the street name',
    'يرجى إدخال تفاصيل العنوان \\(عمارة/شقة\\)': 'Please enter address details (building/apartment)',
    'حدث Error غير متوقع أثناء معالجة طلبك.': 'An unexpected error occurred while processing your order.',
    'لم يتم تلقي رابط المعالجة.': 'Processing link not received.',
    'جاري Loading Order Details...': 'Loading Order Details...',
    'سلتك فارغة أو لم تقم باختيار أي منتجات لشراءها.': 'Your cart is empty or you haven\'t selected any products to buy.',
    'تصفح Products': 'Browse Products',
    'العودة للتسوق': 'Back to Shopping',
    'إتمام الشراء وCheckout': 'Checkout & Complete Purchase',
    'تفاصيل Shipping Address': 'Shipping Address Details',
    'يرجى إدخال بياناتك بشكل صحيح لضمان تسليم المنتج بأسرع وقت.': 'Please enter your details correctly to ensure the fastest delivery.',
    'اNoسم بالكامل': 'Full Name',
    'اNoسم الثNoثي أو الثنائي': 'Full Name (First and Last)',
    'Mobile Number': 'Mobile Number',
    'Phone Number للتوصيل': 'Delivery Phone Number',
    'المحافظة': 'Governorate',
    'اختر المحافظة': 'Select Governorate',
    'اسم الشارع': 'Street Name',
    'مثال: شارع البطل أحمد عبد العزيز': 'e.g., Main Street',
    'تفاصيل العنوان \\(عمارة / دور / شقة\\)': 'Address Details (Building / Floor / Apt)',
    'مثال: عمارة 12، الدور الثالث، شقة 5': 'e.g., Building 12, Floor 3, Apt 5',
    'اختر طريقة Checkout': 'Select Payment Method',
    'Checkout عند اNoستNoم': 'Cash on Delivery',
    'ادفع نقداً عند استNoم المنتج': 'Pay in cash when you receive the product',
    'بطاقة ائتمان / فيزا': 'Credit Card / Visa',
    'Checkout آمن ومحمي بالكامل': 'Fully secure and protected checkout',
    'جاري تأكيد وتسجيل الطلب...': 'Confirming and placing order...',
    'تأكيد وشراء الطلب بقيمة': 'Confirm and buy order for',
    'ملخص طلبك': 'Order Summary',
    'Quantity': 'Quantity',
    'المجموع الفرعي': 'Subtotal',
    'مصاريف الShipping': 'Shipping Fees',
    'مجانًا': 'Free',
    'المجموع الكلي': 'Total',
    'تسوق آمن ومضمون 100%': '100% Safe & Secure Shopping',
    'نحن نضمن حماية جميع بياناتك المالية والشخصية باستخدام تشفير SSL المتقدم.': 'We ensure the protection of all your financial and personal data using advanced SSL encryption.',
    'جاري Loading الصفحة...': 'Loading Page...',
    'طريقة Checkout': 'Payment Method'
};

for (const [ar, en] of Object.entries(dict)) {
    content = content.replace(new RegExp(ar, 'g'), en);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Checkout page translated successfully!');
