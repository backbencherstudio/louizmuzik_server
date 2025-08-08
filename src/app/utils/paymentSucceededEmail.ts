import nodemailer from 'nodemailer';
import config from '../config';

export const paymentSucceededEmail = async (to: string, invoiceUrl: string) => {
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
    subject: '🎉 Thank You for Your Subscription!',
    text: '',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Arial', sans-serif; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <h2 style="color: #3366cc; font-size: 24px; margin-bottom: 10px;">Thank You for Subscribing!</h2>
          <p style="font-size: 16px; color: #444; margin-bottom: 30px;">
            We really appreciate you joining our Melody-Colad. Your support helps us grow and offer even better features.
          </p>
          <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background-color: #3366cc; color: white; padding: 12px 24px; border-radius: 6px; font-size: 16px; text-decoration: none; margin-bottom: 25px;">
            View Your Invoice
          </a>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If you have any questions or face any issues, feel free to contact us at 
            <a href="mailto:${config.sender_email}" style="color: #3366cc;">${config.sender_email}</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="font-size: 13px; color: #999;">© ${year} Melody. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};
