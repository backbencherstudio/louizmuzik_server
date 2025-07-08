/* eslint-disable @typescript-eslint/no-explicit-any */
// =======================================
// ✅ payment.service.ts — FINAL FIXED
// =======================================

import { Buffer } from 'buffer';
import axios from 'axios';
import { AppError } from "../../errors/AppErrors";
import { User } from '../User/user.model';

const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

const generateAccessToken = async () => {
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

const createOrderWithPaypal = async (amount: any, userId: string) => {
    try {
        const accessToken = await generateAccessToken();
        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: { currency_code: 'USD', value: amount },
                        custom_id: userId,
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log("✅ PayPal Order Created:", response.data.id);
        return { id: response.data.id };
    } catch (err: any) {
        console.error("❌ Create Order Error:", err?.response?.data || err.message);
        throw new AppError(500, err?.response?.data?.message || "Something went wrong while creating order");
    }
};

const captureOrder = async (orderID: string) => {
    try {
        const accessToken = await generateAccessToken();
        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log("✅ Order Captured:", response.data);
        return response.data;
    } catch (err: any) {
        console.error("❌ Capture Order Error:", err?.response?.data || err.message);
        throw new AppError(500, err?.response?.data?.message || "Error capturing order");
    }
};

const webhookEvent = async (event: any, headers: any) => {
    try {
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        const {
            'paypal-transmission-id': transmissionId,
            'paypal-transmission-time': timestamp,
            'paypal-transmission-sig': webhookSig,
            'paypal-cert-url': certUrl,
            'paypal-auth-algo': authAlgo,
        } = headers;

        const accessToken = await generateAccessToken();

        const verifyResponse = await axios.post(
            `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
            {
                transmission_id: transmissionId,
                transmission_time: timestamp,
                cert_url: certUrl,
                auth_algo: authAlgo,
                transmission_sig: webhookSig,
                webhook_id: webhookId,
                webhook_event: event,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const isValid = verifyResponse.data.verification_status === 'SUCCESS';
        if (!isValid) {
            console.error('❌ Invalid webhook signature');
            throw new AppError(400, "Invalid webhook signature");
        }

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = event.resource;
            const amount = resource.amount?.value;
            const transactionId = resource.id;
            const customId = resource?.custom_id;
            const purchaseUnit = resource.purchase_units?.[0];
            const userId = purchaseUnit?.custom_id || customId;

            const userData = await User.findById({_id : userId})
            console.log({userData});
            

            console.log('✅ Webhook Verified!');
            console.log('User ID:', userId);
            console.log('Amount:', amount);
            console.log('Transaction ID:', transactionId);

            // You can save transaction to DB here
        }

        return 200;
    } catch (err: any) {
        console.error('❌ Webhook Handling Error:', err?.response?.data || err.message);
        return 500;
    }
};

export const paymentService = {
    createOrderWithPaypal,
    captureOrder,
    webhookEvent
};







// /* eslint-disable @typescript-eslint/no-explicit-any */
// // =======================================
// // ✅ Step 5: payment.service.ts
// // =======================================

// import { Buffer } from 'buffer';
// import axios from 'axios';
// import { AppError } from "../../errors/AppErrors";

// const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

// const generateAccessToken = async () => {
//     const auth = Buffer.from(
//         `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
//     ).toString('base64');

//     const response = await axios.post(
//         `${PAYPAL_API}/v1/oauth2/token`,
//         'grant_type=client_credentials',
//         {
//             headers: {
//                 Authorization: `Basic ${auth}`,
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//         }
//     );

//     return response.data.access_token;
// };

// const createOrderWithPaypal = async (amount: any, userId: string) => {
//     try {
//         const accessToken = await generateAccessToken();
//         const response = await axios.post(
//             `${PAYPAL_API}/v2/checkout/orders`,
//             {
//                 intent: 'CAPTURE',
//                 purchase_units: [
//                     {
//                         amount: { currency_code: 'USD', value: amount },
//                         custom_id: userId,
//                     },
//                 ],
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );
//         return { id: response.data.id };
//     } catch (err) {
//         console.error(err);
//         throw new AppError(500, "Something went wrong");
//     }
// };

// const captureOrder = async (orderID: string) => {
//     try {
//         const accessToken = await generateAccessToken();
//         const response = await axios.post(
//             `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
//             {},
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );
//         return response.data;
//     } catch (err) {
//         console.error(err);
//         throw new AppError(500, "Error capturing order");
//     }
// };

// const webhookEvent = async (event: any, headers: any) => {
//     try {
//         const webhookId = process.env.PAYPAL_WEBHOOK_ID;
//         const {
//             'paypal-transmission-id': transmissionId,
//             'paypal-transmission-time': timestamp,
//             'paypal-transmission-sig': webhookSig,
//             'paypal-cert-url': certUrl,
//             'paypal-auth-algo': authAlgo,
//         } = headers;

//         const accessToken = await generateAccessToken();
//         const verifyResponse = await axios.post(
//             `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
//             {
//                 transmission_id: transmissionId,
//                 transmission_time: timestamp,
//                 cert_url: certUrl,
//                 auth_algo: authAlgo,
//                 transmission_sig: webhookSig,
//                 webhook_id: webhookId,
//                 webhook_event: event,
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         const isValid = verifyResponse.data.verification_status === 'SUCCESS';
//         if (!isValid) {
//             console.log('❌ Invalid webhook signature');
//             throw new AppError(400, "Invalid webhook");
//         }

//         if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
//             const resource = event.resource;
//             const amount = resource.amount?.value;
//             const transactionId = resource.id;
//             const customId = resource?.custom_id;
//             const purchaseUnit = resource.purchase_units?.[0];
//             const userId = purchaseUnit?.custom_id || customId;

//             console.log('✅ Webhook Verified!');
//             console.log('New User ID:', userId);
//             console.log('Amount:', amount);
//             console.log('Transaction ID:', transactionId);
//         }

//         return 200;
//     } catch (err: any) {
//         console.error('Webhook error:', err?.response?.data || err.message);
//         return 500;
//     }
// };

// export const paymentService = {
//     createOrderWithPaypal,
//     captureOrder,
//     webhookEvent
// };










// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Buffer } from 'buffer';
// import axios from 'axios';
// import querystring from 'querystring';
// import httpStatus from 'http-status';
// import { AppError } from "../../errors/AppErrors";
// import { User } from "../User/user.model";


// const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Use live: 'https://api-m.paypal.com'

// const generateAccessToken = async () => {
//     const auth = Buffer.from(
//         `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
//     ).toString('base64');

//     const response = await axios.post(
//         `${PAYPAL_API}/v1/oauth2/token`,
//         'grant_type=client_credentials',
//         {
//             headers: {
//                 Authorization: `Basic ${auth}`,
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//         }
//     );

//     return response.data.access_token;
// };


// const createOrderWithPaypal = async (amount: any, userId: string) => {
//     try {
//         const accessToken = await generateAccessToken();
//         const response = await axios.post(
//             `${PAYPAL_API}/v2/checkout/orders`,
//             {
//                 intent: 'CAPTURE',
//                 purchase_units: [
//                     {
//                         amount: { currency_code: 'USD', value: amount },
//                         custom_id: userId, // ✅ Attach user ID
//                     },
//                 ],
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         return ({ id: response.data.id });
//     } catch (err) {
//         console.error(err);
//         // res.status(500).send('Something went wrong');
//         throw new AppError(500, "Something went wrong")
//     }
// }


// const captureOrder = async (orderID: string) => {
//     console.log(64, orderID);
    
//     try {
//         const accessToken = await generateAccessToken();

//         const response = await axios.post(
//             `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
//             {},
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         return (response.data);
//     } catch (err) {
//         console.error(err);
//         // res.status(500).send('Error capturing order');
//         throw new AppError(500, "Error capturing order")
//     }
// }



// const webhookEvent = async (event : any, headers : any) => {
//     try { 
//         const webhookId = process.env.PAYPAL_WEBHOOK_ID;

//         const {
//             'paypal-transmission-id': transmissionId,
//             'paypal-transmission-time': timestamp,
//             'paypal-transmission-sig': webhookSig,
//             'paypal-cert-url': certUrl,
//             'paypal-auth-algo': authAlgo,
//         } = headers;

//         const accessToken = await generateAccessToken();

//         const verifyResponse = await axios.post(
//             `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
//             {
//                 transmission_id: transmissionId,
//                 transmission_time: timestamp,
//                 cert_url: certUrl,
//                 auth_algo: authAlgo,
//                 transmission_sig: webhookSig,
//                 webhook_id: webhookId,
//                 webhook_event: event,
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         const isValid =
//             verifyResponse.data.verification_status === 'SUCCESS';

//         if (!isValid) {
//             console.log('❌ Invalid webhook signature');
//             // return res.status(400).send('Invalid webhook');
//             throw new AppError(400, "Invalid webhook")
//         }

//         if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
//             const resource = event.resource;
//             const amount = resource.amount?.value;
//             const transactionId = resource.id;
//             // const customId = resource?.supplementary_data?.related_ids?.order_id;
//             const customId = resource?.custom_id;

//             const purchaseUnit = resource.purchase_units?.[0];
//             const userId = purchaseUnit?.custom_id || customId;

//             console.log('✅ Webhook Verified!');
//             console.log('New User ID:', userId);
//             console.log('Amount:', amount);
//             console.log('Transaction ID:', transactionId);

//             // 👉 Save to DB here if needed
//         }

//         // res.sendStatus(200);
//         return (200)
//     } catch (err: any) {
//         console.error('Webhook error:', err?.response?.data || err.message);
//         // res.sendStatus(500);
//         return (500)
//     }
// }



// export const paymentService = {
//     createOrderWithPaypal,
//     captureOrder,
//     webhookEvent
// }


// // =========================================
// // =========================================
// // =========================================
// // =========================================


// // Generate PayPal OAuth URL to link producer's PayPal account
// const clientPaypaLinkToAdminAccountService = async () => {
//     const encodedRedirectUri = encodeURIComponent('http://localhost:5000/api/v1/payment/paypal-callback');  // This URI is where PayPal redirects after authorization
//     const authUrl = `https://www.sandbox.paypal.com/connect?client_id=${process.env.PAYPAL_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${encodedRedirectUri}`;

//     return authUrl;
// };

// // Handle PayPal callback after the user grants access
// const paypalCallBack = async (code: string, userId: string) => {
//     if (!code) throw new AppError(httpStatus.NOT_FOUND, "Authorization failed: No code received");

//     try {
//         // Exchange the authorization code for an access token
//         const response = await axios.post('https://api.paypal.com/v1/oauth2/token', querystring.stringify({
//             grant_type: 'authorization_code',
//             code: code,
//             redirect_uri: 'http://localhost:5000/api/v1/payment/paypal-callback',  // Same as the one in the OAuth URL
//         }), {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
//             }
//         });

//         // Extract access token and user ID from the response
//         const accessToken = response.data.access_token;
//         const producerPayPalAccountId = response.data.user_id;

//         // Save the PayPal account info in the user document
//         await User.findByIdAndUpdate(
//             { _id: userId },
//             {
//                 paypalAccountId: producerPayPalAccountId,
//                 accessToken: accessToken,
//             },
//             { new: true, runValidators: true }
//         );

//         return { message: "PayPal account linked successfully!" };
//     } catch (error) {
//         console.error('Error while exchanging code for token:', error);
//         return { error: "Error linking PayPal account" };
//     }
// };






// // Export services to be used in the controller
// export const PaypalService = {
//     clientPaypaLinkToAdminAccountService,
//     paypalCallBack
// };


