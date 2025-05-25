import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com.',
    // port: 587,
    port: 465,
    secure: true,
    auth: {
      user: 'contacthypno4u@gmail.com',
      pass: 'uraf cokj httc rudj',
    },
  });

  await transporter.sendMail({
    from: `"Hypno4u™"<contacthypno4u@gmail.com>`,
    to,
    subject: 'Set your OTP withen 2m',
    text: '',
    html: `<div style="text-align: center; font-family: Arial, sans-serif; padding: 20px;">
        <p>Your OTP code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: blue;">${otp}</p>
        <p>Please use this code within 2 minutes to reset your password.</p>
      </div>`,
  });
};


export const sendWelcomeEmail = async (recipientEmail : string ) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Secure SSL
    secure: true,
    auth: {
      user: 'contacthypno4u@gmail.com',
      pass: 'uraf cokj httc rudj',
    },
  });

  await transporter.sendMail({
    from: config.sender_email,
    to: recipientEmail,
    subject: 'Welcome to Hypno4U™',
    text: '',
    html: `<div
      style="
        max-width: 600px;
        margin: auto;
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        padding: 20px;
        border-radius: 10px;
      "
    >
      <table
        style="
          width: 100%;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        "
        <tr>
          <td style="padding: 15px; font-size: 18px; color: #333; font-weight: bold">
            <h1 style="color: #333; font-size: 24px; margin: 0">Hypno4U™</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; font-size: 16px; color: #555">
            Welcome, We are excited to have you on board. Get ready to explore
            amazing content and experience the best of what we have to offer.
          </td>
        </tr>
        
        <tr>
          <td style="padding: 15px; font-size: 12px; color: #aaa; border-top: 1px solid #ddd;">
            &copy; 2025. All rights reserved.<br />
            <small>You are receiving this email because you signed up for our service.</small>
          </td>
        </tr>
      </table>
    </div>`,
  });

  console.log(`Welcome email sent to www: ${recipientEmail}`);
};


export const sebscriptionSuccessfullEmail = async (recipientEmail : string ) => {

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Secure SSL
    secure: true,
    auth: {
      user: 'contacthypno4u@gmail.com',
      pass: 'uraf cokj httc rudj',
    },
  });

  await transporter.sendMail({
    from: config.sender_email,
    to: recipientEmail,
    subject: 'Congratulations From Hypno4U™',
    text: '',
    html: `<div
      style="
        max-width: 600px;
        margin: auto;
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        padding: 20px;
        border-radius: 10px;
      "
    >
      <table
        style="
          width: 100%;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        "
        <tr>
          <td style="padding: 15px; font-size: 18px; color: #333; font-weight: bold">
            <h1 style="color: #333; font-size: 24px; margin: 0">Hypno4U™</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; font-size: 16px; color: #555">
           Congratulations! Your subscription has been successfully activated. You can now access your dashboard, enjoy your selected audios, and enhance your personal growth.
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <a href="http://localhost:5173/daily-audios"
              style="
                display: inline-block;
                background-color: #007bff;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                padding: 12px 24px;
                border-radius: 5px;
                font-weight: bold;
              "
            >Discover Your Benefits</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; font-size: 12px; color: #aaa; border-top: 1px solid #ddd;">
            &copy; 2025. All rights reserved.<br />
          </td>
        </tr>
      </table>
    </div>`,
  });

  console.log(`Welcome email sent to: ${recipientEmail}`);
};

// https://hypno4u.com/daily-audios

export const registerSuccessFullEmail = async (recipientEmail : string) => {

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Secure SSL
    secure: true,
    auth: {
      user: 'contacthypno4u@gmail.com',
      pass: 'uraf cokj httc rudj',
    },
  });

  await transporter.sendMail({
    from: config.sender_email,
    to: recipientEmail,
    subject: 'Registration Successfull In Hypno4U™',
    text: '',
    html: `<div
      style="
        max-width: 600px;
        margin: auto;
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        padding: 20px;
        border-radius: 10px;
      "
    >
      <table
        style="
          width: 100%;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        "
        <tr>
          <td style="padding: 15px; font-size: 18px; color: #333; font-weight: bold">
            <h1 style="color: #333; font-size: 24px; margin: 0">Hypno4U™</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; font-size: 16px; color: #555">
            ✅ "Thank you! Your registration was successful."  
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; font-size: 12px; color: #aaa; border-top: 1px solid #ddd;">
            &copy; 2025. All rights reserved.<br />
            <small>You are receiving this email because you signed up for our service.</small>
          </td>
        </tr>
      </table>
    </div>`,
  });

  console.log(`Welcome email sent to: ${recipientEmail}`);
};