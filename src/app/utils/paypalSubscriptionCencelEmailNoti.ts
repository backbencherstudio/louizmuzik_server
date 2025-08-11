import nodemailer from 'nodemailer';
import config from '../config';

export const paypalSubscriptionCencelEmailNoti = async (to: string, name: string) => {
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
        subject: '⚠️ Your Subscription Has Been Set to Cancel',
        text: `
Hello ${name},

Your subscription has been successfully set to cancel at the end of the current billing period. If you have any questions or wish to resubscribe, please feel free to contact us.

Thank you for being with us,
– The Team
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #f44336; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Subscription Set to Cancel</h1>
  </div>
  <div style="padding: 20px;">
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hello ${name},
    </p>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Your subscription has been successfully set to <strong>cancel</strong> at the end of the current billing period.
    </p>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      You will continue to have access to premium features until your trial or billing period ends.
    </p>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Thank you for being with us,
    </p>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; font-weight: bold;">
      – The Team
    </p>
  </div>
  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #888888;">
    <p style="margin: 0;">
      If you have any questions, feel free to 
      <a href="mailto:${config.sender_email}" style="color: #0d6efd; text-decoration: none;">contact us</a>.
    </p>
    <p style="margin: 10px 0 0;">&copy; ${year} The Team. All rights reserved.</p>
  </div>
</div>
        `,
    });
};
