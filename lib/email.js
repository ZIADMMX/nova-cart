import nodemailer from "nodemailer";

// دالة مساعدة لإنشاء الـ Transporter لتجنب تكرار الكود وحمايته
function createMailTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });
}

export async function sendEmailReceipt(userEmail, orderDetails) {
    try {
        const transporter = createMailTransporter();

        let emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #4F46E5;">شكراً لتسوقك من NovaCart!</h1>
                <p>لقد تم استلام طلبك بنجاح. إليك تفاصيل الفاتورة:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin-top: 20px;">
                    <h3>رقم الطلب: ${orderDetails._id || Math.random().toString(36).substring(7)}</h3>
                    <p><strong>الإجمالي:</strong> $${orderDetails.totalPrice}</p>
                </div>
                <h3 style="margin-top: 20px;">المنتجات:</h3>
                <ul style="list-style-type: none; padding: 0;">
        `;

        if (orderDetails.orderItems && orderDetails.orderItems.length > 0) {
            orderDetails.orderItems.forEach(item => {
                emailHtml += `
                    <li style="margin-bottom: 15px; padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <strong>${item.title}</strong> - الكمية: ${item.quantity} - السعر: $${item.price}
                `;
                
                // دمج الداتا الرقمية داخل نفس الـ li ليكون الـ HTML صحيحاً
                if (orderDetails.deliveredData && orderDetails.deliveredData[item._id]) {
                    const data = orderDetails.deliveredData[item._id];
                    emailHtml += `<div style="margin-top: 8px; padding-right: 10px; border-right: 3px solid #10B981;">`;
                    if (data.downloadUrl) {
                        emailHtml += `<p style="margin: 4px 0; color: #10B981;"><a href="${data.downloadUrl}" style="color: #10B981; text-decoration: underline;">اضغط هنا لتحميل المنتج الرقمي</a></p>`;
                    }
                    if (data.licenseKey) {
                        emailHtml += `<p style="margin: 4px 0; color: #10B981;">مفتاح التفعيل الخاص بك: <strong style="background: #eee; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.licenseKey}</strong></p>`;
                    }
                    emailHtml += `</div>`;
                }

                emailHtml += `</li>`;
            });
        }

        emailHtml += `
                </ul>
                <p style="margin-top: 30px;">نتمنى لك يوماً سعيداً!</p>
                <p style="font-size: 12px; color: #94a3b8;">NovaCart Team</p>
            </div>
        `;

        const mailOptions = {
            from: `"NovaCart" <${process.env.EMAIL_USER || 'no-reply@novacart.com'}>`,
            to: userEmail,
            subject: 'فاتورة طلبك من NovaCart',
            html: emailHtml
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully to", userEmail);
        } else {
            console.log("Mock Email Sent to", userEmail, "because EMAIL_USER is not configured.");
        }

        return true;
    } catch (error) {
        console.error("Error sending email receipt:", error);
        return false;
    }
}

export async function sendWelcomeEmail(userEmail, userName) {
    try {
        // حماية: لو مش مأمن البيئة متخليش السيرفر يـ كراش
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("Mock Welcome Email Sent to", userEmail, " (Credentials missing)");
            return true;
        }

        const transporter = createMailTransporter();

        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #333; text-align: center; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h1 style="color: #4F46E5;">مرحباً بك في NovaCart يا ${userName}! 🎉</h1>
                <p style="font-size: 16px; line-height: 1.6;">
                    سعداء جداً بانضمامك لعائلتنا. متجر NovaCart بيقدملك أحدث المنتجات وأفضل العروض والمنتجات الرقمية الحصرية.
                </p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/products" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        ابدأ التسوق الآن
                    </a>
                </div>
                <p style="color: #64748b; font-size: 14px;">إذا كان لديك أي استفسار، المساعد الذكي الخاص بنا متواجد دائماً لمساعدتك.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">مع تحيات،<br>فريق متجر NovaCart</p>
            </div>
        `;

        const mailOptions = {
            from: `"NovaCart" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: 'مرحباً بك في NovaCart! 🎉',
            html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log("Welcome email sent successfully to", userEmail);
        return true;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        return false;
    }
}
