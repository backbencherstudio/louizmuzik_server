/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { AppError } from "../../errors/AppErrors";
import { Buffer } from 'buffer';
import mongoose from 'mongoose';
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

const createOrderWithPaypal = async (amount: any, selectedData: any) => {
  try {
    const accessToken = await generateAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount },
            custom_id: JSON.stringify(selectedData), // ✅ stringify & pass here
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
    return response.data;
  } catch (err: any) {
    console.error("❌ Capture Order Error:", err?.response?.data || err.message);
    throw new AppError(500, err?.response?.data?.message || "Error capturing order");
  }
};

const sendPayoutToEmail = async (receiverEmail: string, amount: number) => {
  try {
    const accessToken = await generateAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v1/payments/payouts`,
      {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You’ve received a payout from MelodyBox",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: "USD",
            },
            receiver: receiverEmail,
            note: "Thanks for selling your music on MelodyBox!",
            sender_item_id: `item_${Date.now()}`,
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

    return response.data;
  } catch (err: any) {
    console.error("❌ Payout Error:", err?.response?.data || err.message);
    throw new AppError(500, "Payout failed");
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

    // 🧾 If the payment was successful
    // if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    //   const resource = event.resource;
    //   const purchaseUnit = resource.purchase_units?.[0];
    //   const selectedDataRaw = purchaseUnit?.custom_id || resource?.custom_id;

    //   let selectedData = {};
    //   try {
    //     selectedData = JSON.parse(selectedDataRaw);
    //   } catch {
    //     console.warn("⚠️ Could not parse selectedData");
    //   }

    //   console.log("🎯 Selected Data from frontend:", selectedData);
    // }

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      const purchaseUnit = resource.purchase_units?.[0];
      const selectedDataRaw = purchaseUnit?.custom_id || resource?.custom_id;

      let selectedData: any[] = [];

      try {
        selectedData = JSON.parse(selectedDataRaw);
      } catch {
        console.warn("⚠️ Could not parse selectedData");
      }

      console.log("🎯 Selected Data from frontend:", selectedData);

      // ✅ Step 1: Extract all producer IDs
      const producerIds = selectedData.map((item) =>
        new mongoose.Types.ObjectId(item.selectedProducerId)
      );

      // ✅ Step 2: Get each producer’s info and calculate totalPrice using aggregation
      const aggregationResult = await User.aggregate([
        {
          $match: {
            _id: { $in: producerIds },
          },
        },
        {
          $addFields: {
            totalPrice: {
              $reduce: {
                input: selectedData,
                initialValue: 0,
                in: {
                  $cond: [
                    { $eq: ['$$this.selectedProducerId', { $toString: '$_id' }] },
                    { $add: ['$$value', '$$this.price'] },
                    '$$value',
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            paypalEmail: 1,
            totalPrice: 1,
          },
        },
      ]);

      // ✅ Step 3: Calculate payout (97%) and platform fee (3%)
      // const payoutList = aggregationResult.map((producer) => {
      //   const gross = producer.totalPrice || 0;
      //   const serviceFee = parseFloat((gross * 0.03).toFixed(2)); // 3%
      //   const payout = parseFloat((gross - serviceFee).toFixed(2)); // 97%

      //   return {
      //     producerId: producer._id.toString(),
      //     paypalEmail: producer.paypalEmail,
      //     grossAmount: gross,
      //     platformFee: serviceFee,
      //     payoutAmount: payout,
      //   };
      // });

      // const payoutList = aggregationResult.map((producer) => {
      //   const gross = producer.totalPrice || 0;

      //   // PayPal transaction fee (approx): 2.9% + $0.30
      //   const paypalFee = parseFloat((gross * 0.029 + 0.3).toFixed(2));

      //   // Your platform fee: 3%
      //   const serviceFee = parseFloat((gross * 0.03).toFixed(2));

      //   // Net payout = gross - paypalFee - serviceFee
      //   const payout = parseFloat((gross - paypalFee - serviceFee).toFixed(2));

      //   return {
      //     producerId: producer._id.toString(),
      //     paypalEmail: producer.paypalEmail,
      //     grossAmount: gross,
      //     paypalFee,
      //     platformFee: serviceFee,
      //     payoutAmount: payout,
      //   };
      // });

      const payoutList = aggregationResult.map((producer) => {
        const gross = producer.totalPrice || 0;

        // Step 1: PayPal transaction fee
        const paypalFee = parseFloat((gross * 0.029 + 0.3).toFixed(2));
        const afterPaypal = gross - paypalFee;

        // Step 2: Platform service fee (3%) from the amount after PayPal cut
        const serviceFee = parseFloat((afterPaypal * 0.03).toFixed(2));
        const payout = parseFloat((afterPaypal - serviceFee).toFixed(2));

        return {
          producerId: producer._id.toString(),
          paypalEmail: producer.paypalEmail,
          grossAmount: gross,
          paypalFee,
          platformFee: serviceFee,
          payoutAmount: payout - parseFloat((payout * 0.03).toFixed(2)),
        };
      });



      console.log("💸 Final Payout List (per producer):", payoutList);

      await Promise.all(
        payoutList.map((item) =>
          sendPayoutToEmail(item.paypalEmail, item.payoutAmount)
        )
      );

      // 🔄 You can now send PayPal payouts here
      // await sendPayPalPayout(payoutList); // <- optional function if you build that


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





// const webhookEvent = async (event: any, headers: any) => {
//   try {
//     const webhookId = process.env.PAYPAL_WEBHOOK_ID;
//     const {
//       'paypal-transmission-id': transmissionId,
//       'paypal-transmission-time': timestamp,
//       'paypal-transmission-sig': webhookSig,
//       'paypal-cert-url': certUrl,
//       'paypal-auth-algo': authAlgo,
//     } = headers;

//     const accessToken = await generateAccessToken();

//     const verifyResponse = await axios.post(
//       `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
//       {
//         transmission_id: transmissionId,
//         transmission_time: timestamp,
//         cert_url: certUrl,
//         auth_algo: authAlgo,
//         transmission_sig: webhookSig,
//         webhook_id: webhookId,
//         webhook_event: event,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const isValid = verifyResponse.data.verification_status === 'SUCCESS';
//     if (!isValid) {
//       console.error('❌ Invalid webhook signature');
//       throw new AppError(400, "Invalid webhook signature");
//     }

//     // 🧾 If the payment was successful
//     if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
//       const resource = event.resource;
//       //   const amount = parseFloat(resource.amount?.value);
//       const grossAmount = parseFloat(resource.amount?.value); // total amount paid by user

//       const transactionId = resource.id;
//       const customId = resource?.custom_id;
//       const purchaseUnit = resource.purchase_units?.[0];
//       const userId = purchaseUnit?.custom_id || customId;

//       // 🔍 Find producer data by userId
//       const userData = await User.findById({ _id: userId });

//       if (!userData?.paypalEmail) {
//         throw new AppError(400, "Producer PayPal email not found");
//       }

//       const producerEmail = userData.paypalEmail;
//       const paypalFee = grossAmount * 0.029 + 0.30;
//       const netAmount = grossAmount - paypalFee;
//       const producerAmount = (netAmount * 0.97).toFixed(2);

//       await sendPayoutToEmail(producerEmail, parseFloat(producerAmount));

//       console.log("✅ Payout successfully sent to producer");
//     }

//     return 200;
//   } catch (err: any) {
//     console.error('❌ Webhook Handling Error:', err?.response?.data || err.message);
//     return 500;
//   }
// };


// export const paymentService = {
//   createOrderWithPaypal,
//   captureOrder,
//   webhookEvent
// };












// /* eslint-disable @typescript-eslint/no-explicit-any */
// // =======================================
// // ✅ payment.service.ts — FINAL FIXED
// // =======================================

// import { Buffer } from 'buffer';
// import axios from 'axios';
// import { AppError } from "../../errors/AppErrors";
// import { User } from '../User/user.model';

// const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

// const generateAccessToken = async () => {
//     try {
//         const auth = Buffer.from(
//             `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
//         ).toString('base64');

//         const response = await axios.post(
//             `${PAYPAL_API}/v1/oauth2/token`,
//             'grant_type=client_credentials',
//             {
//                 headers: {
//                     Authorization: `Basic ${auth}`,
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//             }
//         );

//         console.log("✅ Access Token Generated");
//         return response.data.access_token;
//     } catch (err: any) {
//         console.error("❌ Token Generation Error:", err?.response?.data || err.message);
//         throw new AppError(500, "Failed to generate PayPal access token");
//     }
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
//     } catch (err: any) {
//         console.error("❌ Create Order Error:", err?.response?.data || err.message);
//         throw new AppError(500, err?.response?.data?.message || "Something went wrong while creating order");
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
//     } catch (err: any) {
//         console.error("❌ Capture Order Error:", err?.response?.data || err.message);
//         throw new AppError(500, err?.response?.data?.message || "Error capturing order");
//     }
// };

// const sendPayoutToEmail = async (receiverEmail: string, amount: number) => {
//   try {
//     const accessToken = await generateAccessToken();

//     const response = await axios.post(
//       `${PAYPAL_API}/v1/payments/payouts`,
//       {
//         sender_batch_header: {
//           sender_batch_id: `batch_${Date.now()}`,
//           email_subject: "You’ve received a payout from MelodyBox",
//         },
//         items: [
//           {
//             recipient_type: "EMAIL",
//             amount: {
//               value: amount.toFixed(2),
//               currency: "USD",
//             },
//             receiver: receiverEmail,
//             note: "Thanks for selling your music on MelodyBox!",
//             sender_item_id: `item_${Date.now()}`,
//           },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     return response.data;
//   } catch (err: any) {
//     console.error("❌ Payout Error:", err?.response?.data || err.message);
//     throw new AppError(500, "Payout failed");
//   }
// };

// const webhookEvent = async (event: any, headers: any) => {
//   try {
//     const webhookId = process.env.PAYPAL_WEBHOOK_ID;
//     const {
//       'paypal-transmission-id': transmissionId,
//       'paypal-transmission-time': timestamp,
//       'paypal-transmission-sig': webhookSig,
//       'paypal-cert-url': certUrl,
//       'paypal-auth-algo': authAlgo,
//     } = headers;

//     const accessToken = await generateAccessToken();

//     const verifyResponse = await axios.post(
//       `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
//       {
//         transmission_id: transmissionId,
//         transmission_time: timestamp,
//         cert_url: certUrl,
//         auth_algo: authAlgo,
//         transmission_sig: webhookSig,
//         webhook_id: webhookId,
//         webhook_event: event,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const isValid = verifyResponse.data.verification_status === 'SUCCESS';
//     if (!isValid) {
//       console.error('❌ Invalid webhook signature');
//       throw new AppError(400, "Invalid webhook signature");
//     }

//     // 🧾 If the payment was successful
//     if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
//       const resource = event.resource;
//     //   const amount = parseFloat(resource.amount?.value);
//    const grossAmount = parseFloat(resource.amount?.value); // total amount paid by user

//       const transactionId = resource.id;
//       const customId = resource?.custom_id;
//       const purchaseUnit = resource.purchase_units?.[0];
//       const userId = purchaseUnit?.custom_id || customId;

//       // 🔍 Find producer data by userId
//       const userData = await User.findById({ _id: userId });

//       if (!userData?.paypalEmail) {
//         throw new AppError(400, "Producer PayPal email not found");
//       }

//       const producerEmail = userData.paypalEmail;
//       const paypalFee = grossAmount * 0.029 + 0.30;
//       const netAmount = grossAmount - paypalFee;
//       const producerAmount = (netAmount * 0.97).toFixed(2);

//       await sendPayoutToEmail(producerEmail, parseFloat(producerAmount));

//       console.log("✅ Payout successfully sent to producer");
//     }

//     return 200;
//   } catch (err: any) {
//     console.error('❌ Webhook Handling Error:', err?.response?.data || err.message);
//     return 500;
//   }
// };


// export const paymentService = {
//     createOrderWithPaypal,
//     captureOrder,
//     webhookEvent
// };

