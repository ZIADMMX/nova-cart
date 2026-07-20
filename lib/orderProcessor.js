import Product from "@/model/Product";
import { sendEmailReceipt } from "./email";
import User from "@/model/User";

export async function processOrderSuccess(order) {
    if (order.status === "Delivered" || (order.deliveredData && Object.keys(order.deliveredData).length > 0)) {
        return order; // already processed
    }

    let deliveredData = {};
    let hasDigital = false;
    let allDigital = true;

    for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (!product) {
            allDigital = false;
            continue;
        }

        if (product.productType === "digital_file") {
            hasDigital = true;
            deliveredData[item.product.toString()] = {
                downloadUrl: product.downloadUrl
            };
        } else if (product.productType === "license_key") {
            hasDigital = true;
            let keysToGive = [];
            // Pop keys from pool
            for (let i = 0; i < item.qty; i++) {
                if (product.licenseKeysPool && product.licenseKeysPool.length > 0) {
                    keysToGive.push(product.licenseKeysPool.pop());
                }
            }
            await product.save();
            deliveredData[item.product.toString()] = {
                licenseKey: keysToGive.join(", ") || "لا توجد مفاتيح متاحة حالياً، يرجى التواصل مع الدعم."
            };
        } else {
            allDigital = false;
        }
    }

    if (hasDigital) {
        order.deliveredData = deliveredData;
        if (allDigital && order.status !== "Pending") {
            order.status = "Delivered"; // Auto fulfill if fully digital
        }
        await order.save();
    }

    // Send Email
    try {
        let userEmail = null;
        if (order.shippingAddress && order.shippingAddress.email) {
            userEmail = order.shippingAddress.email;
        } else {
            const user = await User.findById(order.user);
            if (user && user.email) {
                userEmail = user.email;
            }
        }
        
        if (userEmail) {
            await sendEmailReceipt(userEmail, order);
        }
    } catch (err) {
        console.error("Failed to send email in order processor:", err);
    }

    return order;
}
