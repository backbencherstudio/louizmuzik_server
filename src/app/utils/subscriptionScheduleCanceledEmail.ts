import nodemailer from 'nodemailer';
import config from '../config';

export const subscriptionScheduleCanceledEmail = async (to: string, name: string) => {
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
        subject: '⚠️ Your Subscription Has Been Canceled',
        text: '',
        html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Arial', sans-serif; background-color: #fff3f3; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="text-align: center;">
    <h2 style="color: #cc0000; font-size: 24px; margin-bottom: 10px;">Subscription Ended</h2>
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      Hi ${name}, your subscription has officially ended, and your account has been removed from our subscriber list.
    </p>
    <p style="font-size: 15px; color: #555; margin-bottom: 30px;">
      You no longer have access to premium features. But don’t worry — you can resubscribe anytime to continue enjoying all the benefits.
    </p>
    <a href="${config.client_base_url}/checkout-membership" target="_blank" style="display: inline-block; background-color: #cc0000; color: white; padding: 12px 24px; border-radius: 6px; font-size: 16px; text-decoration: none; margin-bottom: 25px;">
      Resubscribe Now
    </a>
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If you have any questions or think this was a mistake, feel free to contact us at 
      <a href="mailto:${config.sender_email}" style="color: #cc0000;">${config.sender_email}</a>.
    </p>
  </div>
  <div style="text-align: center; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
    <p style="font-size: 13px; color: #999;">© ${year} Melody. All rights reserved.</p>
  </div>
</div>

    `,
    });
};
