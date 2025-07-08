/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { AppError } from "../errors/AppErrors";
import { Buffer } from 'buffer';


export const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

export const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
    ).toString('base64');

    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log("✅ Access Token Generated");
    return response.data.access_token;
  } catch (err: any) {
    console.error("❌ Token Generation Error:", err?.response?.data || err.message);
    throw new AppError(500, "Failed to generate PayPal access token");
  }
};
