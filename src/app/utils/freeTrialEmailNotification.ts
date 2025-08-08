import nodemailer from 'nodemailer';
import config from '../config';

export const freeTrialEmailNotification = async (to: string) => {
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
    subject: '✅ Your Free Trial is Now Active!',
    text: '',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Arial', sans-serif; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <h2 style="color: #3366cc; font-size: 24px; margin-bottom: 10px;">Your 7-Day Free Trial Has Started!</h2>
          <p style="font-size: 16px; color: #444; margin-bottom: 20px;">
            Thank you for signing up with Melody-Colad! Your free trial is now active, and you have full access to all features for the next 7 days—completely free of charge.
          </p>
          <p style="font-size: 16px; color: #444; margin-bottom: 20px;">
            Please note: If you do not cancel your subscription within the 7-day trial period, your paid subscription will be automatically activated, and the subscription amount will be charged to your account. This subscription will continue until a payment fails or you cancel manually.
          </p>
         
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If you have any questions or need help, feel free to contact us at 
            <a href="mailto:${config.sender_email}" style="color: #3366cc;">${config.sender_email}</a>.
          </p>
        </div>
        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="font-size: 13px; color: #999;">© ${year} Melody. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};
