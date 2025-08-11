import nodemailer from 'nodemailer';
import config from '../config';

export const paypalPaymentSaleDeniedNotification = async (to: string, name: string, amount: string) => {

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: config.sender_email,
            pass: config.email_pass,
        },
    });

    const year = new Date().getFullYear();

    await transporter.sendMail({
        from: config.sender_email,
        to,
        subject: '🚫 Payment Failed – Action Required',
        text: `
Hi ${name},

Unfortunately, your recent payment of $${amount} was denied by your payment provider.  
This means your subscription is at risk of cancellation.  

Please update your payment method or contact us if you believe this is a mistake.  

– The Team
    `,
        html: `
<div style="max-width: 500px; margin: 0 auto; padding: 25px; font-family: 'Arial', sans-serif; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.1); border-top: 5px solid #cc0000; background: linear-gradient(to bottom, #ffffff, #fff5f5);">
  <div style="text-align: center;">
    <h2 style="color: #cc0000; margin: 0 0 20px; font-size: 22px;">Payment Denied</h2>
    <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
      Hi ${name}, unfortunately your recent payment of <strong>$${amount}</strong> could not be processed.
    </p>
    <div style="background-color: #ffecec; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #cc0000;">
      <p style="font-size: 15px; color: #cc0000; margin: 0;">
        This could be due to insufficient funds, an expired card, or your bank declining the transaction.
      </p>
    </div>
    <p style="color: #777; font-size: 14px; margin-bottom: 20px;">
      To avoid interruption to your premium access, please update your payment details as soon as possible.
    </p>
    <a href="${config.client_base_url}/billing" target="_blank" style="display: inline-block; background-color: #cc0000; color: white; padding: 12px 24px; border-radius: 6px; font-size: 16px; text-decoration: none; margin-top: 15px;">
      Update Payment Method
    </a>
    <p style="color: #777; font-size: 14px; margin-top: 25px;">
      If you believe this was a mistake, please contact us at 
      <a href="mailto:${config.sender_email}" style="color: #cc0000;">${config.sender_email}</a>.
    </p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 13px; margin: 0;">© ${year} Melody. All rights reserved.</p>
    </div>
  </div>
</div>
    `,
    });
};
