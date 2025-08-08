/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import config from '../config';

export const stripePaymentFailedEmail = async (to: string) => {
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
    subject: '⚠️ Subscription Payment Failed',
    text: '',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Arial', sans-serif; background-color: #fff3f3; border-radius: 8px; box-shadow: 0 4px 12px rgba(255,0,0,0.1);">
        <div style="text-align: center;">
          <h2 style="color: #cc0000; font-size: 24px; margin-bottom: 10px;">Payment Failed</h2>
          <p style="font-size: 16px; color: #444; margin-bottom: 20px;">
            Unfortunately, your recent subscription payment did not go through.
          </p>
          <p style="font-size: 15px; color: #555; margin-bottom: 20px;">
            As a result, your premium access is currently <strong>inactive</strong>. You're not considered a valid Pro user until the payment is successfully completed.
          </p>
          <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
            Please update your payment method or try again to continue enjoying premium features.
          </p>
          <p style="font-size: 14px; color: #666;">
            If you have any questions or need assistance, feel free to reach out to us at 
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
