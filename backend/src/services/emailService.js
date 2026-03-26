import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('[Email Service] Initializing SMTP Transport...');
console.log(`[Email Service] EMAIL_USER configured: ${!!process.env.EMAIL_USER}`);
console.log(`[Email Service] EMAIL_PASS configured: ${!!process.env.EMAIL_PASS}`);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
  }
});
/**
 * Send an email notification for order status updates
 * @param {string} toEmail - Recipient email address
 * @param {Object} order - Order details
 * @param {string} status - New order status
 */
export const sendOrderNotification = async (toEmail, order, status) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`[Email Service] Skipping email to ${toEmail}. EMAIL_USER / EMAIL_PASS not set.`);
      return false;
    }

    let subject = '';
    let htmlContent = '';

    const orderNumber = order.order_number || order._id;

    switch (status) {
      case 'PLACED': {
        const deliveryInfo = order.delivery_type === 'SCHEDULED' 
          ? `<p>Delivery Scheduled: <strong>${new Date(order.delivery_date).toLocaleDateString()} - ${order.delivery_slot}</strong></p>`
          : `<p>Delivery: <strong>Instant (30-60 mins)</strong></p>`;

        subject = `Order Confirmation - ${orderNumber}`;
        htmlContent = `
          <h2>Thank you for your order!</h2>
          <p>We have successfully received your order <strong>#${orderNumber}</strong>.</p>
          <p>Total Amount: ₹${order.total_amount}</p>
          ${deliveryInfo}
          <p>We'll notify you once it's verified and assigned to a rider.</p>
        `;
        break;
      }
      case 'ASSIGNED':
      case 'ACCEPTED':
        subject = `Rider Assigned to Order - ${orderNumber}`;
        htmlContent = `
          <h2>Your order is being prepared!</h2>
          <p>Our rider has been assigned and will be picking up your order soon.</p>
          <p>Order: <strong>#${orderNumber}</strong></p>
        `;
        break;
      case 'OUT_FOR_DELIVERY':
        subject = `Your Order is Out for Delivery! - ${orderNumber}`;
        htmlContent = `
          <h2>Your food is on the way!</h2>
          <p>Our rider is currently heading to your location with order <strong>#${orderNumber}</strong>.</p>
          <p>You can track the order status directly from your dashboard.</p>
        `;
        break;
      case 'DELIVERED':
        subject = `Order Delivered - ${orderNumber}`;
        htmlContent = `
          <h2>Delivered!</h2>
          <p>Your order <strong>#${orderNumber}</strong> has been successfully delivered.</p>
          <p>Enjoy your meal, and thank you for choosing CU Harvest!</p>
        `;
        break;
      default:
        // Don't send emails for other statuses by default unless needed
        return false;
    }

    const mailOptions = {
      from: `"CU Harvest" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Status Email (${status}) sent to ${toEmail}: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('[Email Service] Failed to send email:', error.message);
    return false;
  }
};
