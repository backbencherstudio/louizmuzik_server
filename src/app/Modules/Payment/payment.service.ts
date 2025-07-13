/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';
import mongoose from 'mongoose';
import { User } from '../User/user.model';
import { generateAccessToken, PAYPAL_API } from '../../middleware/generateAccessTokenForPaypal';
import { sendPayoutToEmail } from '../../middleware/sendPayoutToEmail';
import { AppError } from '../../errors/AppErrors';


// const createOrderWithPaypal = async (amount: any, selectedData: any) => {
//   try {
//     const accessToken = await generateAccessToken();
//     const response = await axios.post(
//       `${PAYPAL_API}/v2/checkout/orders`,
//       {
//         intent: 'CAPTURE',
//         purchase_units: [
//           {
//             amount: { currency_code: 'USD', value: amount },
//             custom_id: JSON.stringify(selectedData),
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
//     return { id: response.data.id };
//   } catch (err: any) {
//     console.error("❌ Create Order Error:", err?.response?.data || err.message);
//     throw new AppError(500, err?.response?.data?.message || "Something went wrong while creating order");
//   }
// };

// const paypalSubscription = async (amount: any) => {
//   // const { amount } = req.body;
//   const accessToken = await generateAccessToken();
//   console.log("hiiiiitttttt");


//   try {
//     // 1️⃣ Create Product
//     const product = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/catalogs/products`,
//       {
//         name: "Dynamic Subscription Product",
//         type: "SERVICE",
//         category: "SOFTWARE",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // 2️⃣ Create Plan with passed amount
//     const plan = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/plans`,
//       {
//         product_id: product.data.id,
//         name: `Subscription for $${amount}`,
//         billing_cycles: [
//           {
//             frequency: { interval_unit: "MONTH", interval_count: 1 },
//             tenure_type: "REGULAR",
//             sequence: 1,
//             total_cycles: 0,
//             pricing_scheme: {
//               fixed_price: {
//                 value: amount.toString(),
//                 currency_code: "USD",
//               },
//             },
//           },
//         ],
//         payment_preferences: {
//           auto_bill_outstanding: true,
//           payment_failure_threshold: 1,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // 3️⃣ Create Subscription
//     const subscription = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
//       {
//         plan_id: plan.data.id,
//         application_context: {
//           brand_name: "",
//           user_action: "SUBSCRIBE_NOW",
//           return_url: "http://localhost:3000/success",
//           cancel_url: "http://localhost:3000/cancel",
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const approvalLink = subscription.data.links.find(
//       (link: { rel: string; }) => link.rel === "approve"
//     );

//     // res.json({ url: approvalLink.href });
//     return { url: approvalLink.href }
//   } catch (err: any) {
//     // res.status(500).json({ error: err.response?.data || err.message });
//     // throw new AppError(500, err.response?.data || err.message)
//     throw new AppError(500,  err?.response?.data || err?.message);
//   }
// }

export const paypalSubscription = async (amount: number, paypalEmail: string) => {
  const accessToken = await generateAccessToken();

  try {
    const product = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/catalogs/products`,
      {
        name: "Dynamic Subscription Product",
        type: "SERVICE",
        category: "SOFTWARE",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const plan = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/plans`,
      {
        product_id: product.data.id,
        name: `Subscription for $${amount}`,
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: amount.toString(),
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 1,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscription = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        plan_id: plan.data.id,
        application_context: {
          brand_name: "melody",
          user_action: "SUBSCRIBE_NOW",
          return_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cancel",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const userData = await User.findOne({ paypalEmail }).select("paypalSubscriptionId")
    // const userData = await User.findOne({ paypalEmail }).select("paypalSubscriptionId");

    if (userData?.paypalSubscriptionId) {
      const existingSubId = userData?.paypalSubscriptionId;
      try {
        // ✅ Cancel the existing subscription
        await axios.post(
          `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${existingSubId}/cancel`,
          { reason: "User upgraded or changed subscription." },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("✅ Previous subscription canceled:", existingSubId);
      } catch (cancelErr: unknown) {
        const err = cancelErr as AxiosError;
        console.warn("⚠️ Failed to cancel previous subscription:", err.response?.data || err.message);
      }
    }

    await User.findOneAndUpdate(
      { paypalEmail },
      {
        isPro: true,
        paypalSubscriptionId: subscription?.data?.id,
        paypalPlanId: plan?.data?.id,
        subscribedAmount: amount,
      },
      { new: true, runValidators: true }
    )

    const approvalLink = subscription.data.links.find(
      (link: any) => link.rel === "approve"
    );

    if (!approvalLink) {
      throw new AppError(500, "Approval link not found");
    }

    return { url: approvalLink.href };

  } catch (error: any) {
    console.error("❌ Paypal Subscription Error:", error.response?.data || error.message);
    throw new AppError(500, error.response?.data?.message || error.message);
  }
};


const createOrderWithPaypal = async (amount: any, selectedData: any) => {
  try {
    const accessToken = await generateAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount,
            },
            custom_id: JSON.stringify(selectedData),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { id: response.data.id };
  } catch (err: any) {
    const statusCode = err?.response?.status || 500;

    // Extract possible PayPal error message
    const paypalError = err?.response?.data;
    const mainMessage = paypalError?.message || err.message || "Unknown PayPal error";
    const detailedDescription = paypalError?.details?.[0]?.description;

    const finalMessage = detailedDescription
      ? `${mainMessage}: ${detailedDescription}`
      : mainMessage;

    console.error("❌ PayPal Create Order Error:", paypalError);

    throw new AppError(statusCode, `PayPal Error - ${finalMessage}`);
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

    console.log("webhook hiiitt");


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

      const producerIds = selectedData.map((item) =>
        new mongoose.Types.ObjectId(item.selectedProducerId)
      );

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

      const payoutList = aggregationResult.map((producer) => {
        const gross = producer.totalPrice || 0;
        const paypalFee = parseFloat((gross * 0.029 + 0.3).toFixed(2)) * 2;
        const afterPaypal = gross - paypalFee;
        const serviceFee = parseFloat((afterPaypal * 0.03).toFixed(2));
        const payout = parseFloat((afterPaypal - serviceFee).toFixed(2));

        return {
          producerId: producer._id.toString(),
          paypalEmail: producer.paypalEmail,
          grossAmount: gross,
          paypalFee,
          platformFee: serviceFee,
          payoutAmount: payout,
        };
      });

      console.log("💸 Final Payout List (per producer):", payoutList);

      await Promise.all(
        payoutList.map((item) =>
          sendPayoutToEmail(item.paypalEmail, item.payoutAmount)
        )
      );
    }


    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subscriptionId = event.resource.id;
      const planId = event.resource.plan_id;
      const email = event.resource.subscriber.email_address;
      const name = `${event.resource.subscriber.name.given_name} ${event.resource.subscriber.name.surname}`;

      console.log("✅ Subscription ID:", subscriptionId);
      console.log("👤 Customer Name:", name);
      console.log("📧 Customer Email:", email);
      console.log("🧾 Plan ID:", planId);

      // ➕ Here you can store the data to MongoDB or any DB
    }





    return 200;
  } catch (err: any) {
    console.error('❌ Webhook Handling Error:', err?.response?.data || err.message);
    return 500;
  }
};


export const paymentService = {
  paypalSubscription,
  createOrderWithPaypal,
  captureOrder,
  webhookEvent
};










