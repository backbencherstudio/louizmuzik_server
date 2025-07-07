import { Buffer } from 'buffer';
import axios from 'axios';
import querystring from 'querystring';
import httpStatus from 'http-status';
import { AppError } from "../../errors/AppErrors";
import { User } from "../User/user.model";

// Generate PayPal OAuth URL to link producer's PayPal account
const clientPaypaLinkToAdminAccountService = async () => {
    const encodedRedirectUri = encodeURIComponent('http://localhost:5000/api/v1/payment/paypal-callback');  // This URI is where PayPal redirects after authorization
    const authUrl = `https://www.sandbox.paypal.com/connect?client_id=${process.env.PAYPAL_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${encodedRedirectUri}`;

    return authUrl;
};

// Handle PayPal callback after the user grants access
const paypalCallBack = async (code: string, userId: string) => {
    if (!code) throw new AppError(httpStatus.NOT_FOUND, "Authorization failed: No code received");

    try {
        // Exchange the authorization code for an access token
        const response = await axios.post('https://api.paypal.com/v1/oauth2/token', querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://localhost:5000/api/v1/payment/paypal-callback',  // Same as the one in the OAuth URL
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
            }
        });

        // Extract access token and user ID from the response
        const accessToken = response.data.access_token;
        const producerPayPalAccountId = response.data.user_id;

        // Save the PayPal account info in the user document
        await User.findByIdAndUpdate(
            { _id: userId },
            {
                paypalAccountId: producerPayPalAccountId,
                accessToken: accessToken,
            },
            { new: true, runValidators: true }
        );

        return { message: "PayPal account linked successfully!" };
    } catch (error) {
        console.error('Error while exchanging code for token:', error);
        return { error: "Error linking PayPal account" };
    }
};






// Export services to be used in the controller
export const PaypalService = {
    clientPaypaLinkToAdminAccountService,
    paypalCallBack
};
















// import httpStatus from "http-status";
// import { AppError } from "../../errors/AppErrors";
// import { User } from "../User/user.model";
// import axios from "axios";
// import querystring from 'querystring';


// const clientPaypaLinkToAdminAccountService = async () => {
//     const redirectUri = 'http://localhost:5000/payment/paypal-callback';
//     const authUrl = `https://www.paypal.com/connect?client_id=${process.env.PAYPAL_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;

//     return authUrl
// }

// const paypalCallBack = async (code: string, userId: string) => {

//     if (!code) throw new AppError(httpStatus.NOT_FOUND, "Authorization failed: No code received")

//     try {
//         const response = await axios.post('https://api.paypal.com/v1/oauth2/token', querystring.stringify({
//             grant_type: 'authorization_code',
//             code: code,
//             redirect_uri: 'http://localhost:5000/payment/paypal-callback',
//         }), {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
//             }
//         });

//         const accessToken = response.data.access_token;
//         const producerPayPalAccountId = response.data.user_id;

//         // const producer = new Producer({
//         //     userId,
//         //     paypalAccountId: producerPayPalAccountId,
//         //     accessToken: accessToken,
//         // });

//         // await producer.save();

//         await User.findByIdAndUpdate(
//             { _id: userId },
//             {
//                 paypalAccountId: producerPayPalAccountId,
//                 accessToken: accessToken
//             },
//             { new: true, runValidators: true }
//         )

//         return { message: "PayPal account linked successfully!" }
//     } catch (error) {
//         console.error('Error while exchanging code for token:', error);
//         return { error: "Error linking PayPal account" }
//     }
// }


// export const PaypalService = {
//     clientPaypaLinkToAdminAccountService,
//     paypalCallBack
// }




