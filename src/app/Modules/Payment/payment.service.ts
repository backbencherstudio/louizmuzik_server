/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';
import mongoose from 'mongoose';
import { User } from '../User/user.model';
import { generateAccessToken, PAYPAL_API } from '../../middleware/generateAccessTokenForPaypal';
import { sendPayoutToEmail } from '../../middleware/sendPayoutToEmail';
import { AppError } from '../../errors/AppErrors';
import { Transactions } from './payment.module';
import httpStatus from 'http-status';
import { freeTrialEmailNotification } from '../../utils/freeTrialEmailNotification';
import { paymentSucceededEmail } from '../../utils/paymentSucceededEmail';
import { paypalSubscriptionCencelEmailNoti } from '../../utils/paypalSubscriptionCencelEmailNoti';
import { stripePaymentFailedEmail } from '../../utils/stripePaymentFailedEmail';
import { paypalPaymentSaleDeniedNotification } from '../../utils/paypalPaymentSaleDeniedNotification';
import { subscriptionScheduleCanceledEmail } from '../../utils/subscriptionScheduleCanceledEmail';


// const paypalSubscription = async (amount: number, userEmail: string) => {
//   const accessToken = await generateAccessToken();

//   try {
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

//     const plan = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/plans`,
//       {
//         product_id: product.data.id,
//         name: `Subscription for $${amount}`,
//         billing_cycles: [
//           // <-- Added 7-day FREE TRIAL cycle (TRIAL)
//           {
//             frequency: { interval_unit: "DAY", interval_count: 7 }, // ৭ দিনের ট্রায়াল
//             tenure_type: "TRIAL",
//             sequence: 1,
//             total_cycles: 1, // ট্রায়াল একবার চলবে
//             pricing_scheme: {
//               fixed_price: {
//                 value: "0", // ট্রায়ালে টাকা কাটা হবে না
//                 currency_code: "USD",
//               },
//             },
//           },
//           // <-- Regular monthly billing cycle
//           {
//             frequency: { interval_unit: "MONTH", interval_count: 1 },
//             tenure_type: "REGULAR",
//             sequence: 2,
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

//     const subscription = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
//       {
//         plan_id: plan.data.id,
//         custom_id: userEmail,
//         application_context: {
//           brand_name: "melody",
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
//       (link: any) => link.rel === "approve"
//     );

//     if (!approvalLink) {
//       throw new AppError(500, "Approval link not found");
//     }

//     return { url: approvalLink.href };

//   } catch (error: any) {
//     console.error("❌ Paypal Subscription Error:", error.response?.data || error.message);
//     throw new AppError(500, error.response?.data?.message || error.message);
//   }
// };


// const paypalSubscription = async (amount: number, userEmail: string) => {
//   const accessToken = await generateAccessToken();

//   try {
//     // 1) Find user in DB
//     const user = await User.findOne({ email: userEmail });
//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     // If user already used trial -> do NOT give trial
//     // If user has started a trial subscription previously but hasUsedTrial flag is false (edge case),
//     // and they now call this function to start paid immediately, we'll cancel existing and mark hasUsedTrial = true.
//     let giveTrial = user.hasUsedTrial; // if undefined -> treated as false => giveTrial = true

//     console.log({giveTrial});
    

//     // If user has an existing paypalSubscriptionId and hasn't been marked hasUsedTrial,
//     // we assume they started a trial earlier — user wants to upgrade now:
//     if (user.paypalSubscriptionId && user.hasUsedTrial) {
//       console.log('User has existing subscription (likely trial). Cancelling trial to start paid subscription now.');
//       try {
//         // Cancel the existing subscription
//         await axios.post(
//           `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
//           { reason: 'User upgraded from trial to paid subscription.' },
//           {
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         // fetch its plan id to deactivate
//         const subRes = await axios.get(
//           `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}`,
//           {
//             headers: { Authorization: `Bearer ${accessToken}` },
//           }
//         );
//         const oldPlanId = subRes.data.plan_id;
//         if (oldPlanId) {
//           await axios.post(
//             `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${oldPlanId}/deactivate`,
//             {},
//             {
//               headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json',
//               },
//             }
//           );
//         }

//         // mark hasUsedTrial so user never gets trial again
//         await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true });

//         // after cancelling, we will NOT give trial for the new plan
//         giveTrial = false;
//       } catch (cancelErr: any) {
//         console.warn('⚠️ Failed to cancel existing trial subscription:', cancelErr?.response?.data || cancelErr?.message);
//         // proceed anyway to create a paid plan (but inform via logs)
//         giveTrial = false;
//         await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true }).catch(() => { });
//       }
//     }

//     // 2) Create product
//     const product = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/catalogs/products`,
//       {
//         name: 'Dynamic Subscription Product',
//         type: 'SERVICE',
//         category: 'SOFTWARE',
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // 3) Build billing_cycles based on giveTrial flag
//     const billing_cycles: any[] = [];

//     if (!giveTrial) {
//       billing_cycles.push({
//         frequency: { interval_unit: 'DAY', interval_count: 7 }, // 7-day trial
//         tenure_type: 'TRIAL',
//         sequence: 1,
//         total_cycles: 1,
//         pricing_scheme: {
//           fixed_price: {
//             value: '0',
//             currency_code: 'USD',
//           },
//         },
//       });
//       // Regular cycle will be sequence 2
//       billing_cycles.push({
//         frequency: { interval_unit: 'MONTH', interval_count: 1 },
//         tenure_type: 'REGULAR',
//         sequence: 2,
//         total_cycles: 0,
//         pricing_scheme: {
//           fixed_price: {
//             value: amount.toString(),
//             currency_code: 'USD',
//           },
//         },
//       });
//     } else {
//       // No trial — only regular cycle (sequence 1)
//       billing_cycles.push({
//         frequency: { interval_unit: 'MONTH', interval_count: 1 },
//         tenure_type: 'REGULAR',
//         sequence: 1,
//         total_cycles: 0,
//         pricing_scheme: {
//           fixed_price: {
//             value: amount.toString(),
//             currency_code: 'USD',
//           },
//         },
//       });
//     }

//     const plan = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/plans`,
//       {
//         product_id: product.data.id,
//         name: `Subscription for $${amount}`,
//         billing_cycles,
//         payment_preferences: {
//           auto_bill_outstanding: true,
//           payment_failure_threshold: 1,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // 4) Create subscription (user will have to approve it via returned approval link)
//     const subscription = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
//       {
//         plan_id: plan.data.id,
//         custom_id: userEmail,
//         application_context: {
//           brand_name: 'melody',
//           user_action: 'SUBSCRIBE_NOW',
//           return_url: 'http://localhost:3000/success',
//           cancel_url: 'http://localhost:3000/cancel',
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const approvalLink = subscription.data.links.find((link: any) => link.rel === 'approve');

//     if (!approvalLink) {
//       throw new AppError(500, 'Approval link not found');
//     }

//     // 5) Mark hasUsedTrial true if we gave trial (so user won't get trial again later)
//     //    Also, if we forced cancellation because user upgraded, we already set hasUsedTrial = true earlier.
//     if (!giveTrial) {
//       await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true }).catch(() => { });
//     }

//     // 6) Save the created subscription id & plan id (optional — webhook will also update on activation)
//     try {
//       // await User.findByIdAndUpdate(
//       //   user._id,
//       //   {
//       //     paypalSubscriptionId: subscription.data.id || null,
//       //     paypalPlanId: plan.data.id || null,
//       //   },
//       //   { new: true, runValidators: true }
//       // );
//     } catch (e) {
//       console.warn('⚠️ Failed to save paypalSubscriptionId/paypalPlanId locally:', (e as any)?.message || e);
//     }

//     return { url: approvalLink.href, subscriptionId: subscription.data.id, planId: plan.data.id, trialGiven: giveTrial };
//   } catch (error: any) {
//     console.error('❌ Paypal Subscription Error:', error.response?.data || error.message);
//     throw new AppError(500, error.response?.data?.message || error.message);
//   }
// };


const paypalSubscription = async (amount: number, userEmail: string) => {
  const accessToken = await generateAccessToken();

  try {
    // 1) Find user in DB
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // If user has NOT used trial before (false or undefined) => giveTrial = true (trial allowed)
    // If user has used trial before (true) => giveTrial = false (no trial)
    let giveTrial = !user.hasUsedTrial;

    console.log({ giveTrial });

    // If user has an existing paypalSubscriptionId and hasUsedTrial = false (edge case)
    // we cancel existing trial and mark trial as used, because now they want paid subscription immediately
    if (user.paypalSubscriptionId && !user.hasUsedTrial) {
      console.log('User has existing subscription (likely trial). Cancelling trial to start paid subscription now.');
      try {
        // Cancel the existing subscription
        await axios.post(
          `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
          { reason: 'User upgraded from trial to paid subscription.' },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // fetch plan id to deactivate
        const subRes = await axios.get(
          `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const oldPlanId = subRes.data.plan_id;
        if (oldPlanId) {
          await axios.post(
            `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${oldPlanId}/deactivate`,
            {},
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // mark hasUsedTrial so user never gets trial again
        await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true });

        // after cancelling, we will NOT give trial for the new plan
        giveTrial = false;
      } catch (cancelErr: any) {
        console.warn('⚠️ Failed to cancel existing trial subscription:', cancelErr?.response?.data || cancelErr?.message);
        // proceed anyway to create a paid plan (but inform via logs)
        giveTrial = false;
        await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true }).catch(() => { });
      }
    }

    // 2) Create product
    const product = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/catalogs/products`,
      {
        name: 'Dynamic Subscription Product',
        type: 'SERVICE',
        category: 'SOFTWARE',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 3) Build billing_cycles based on giveTrial flag
    const billing_cycles: any[] = [];

    if (giveTrial) {
      // User gets a 7-day free trial first (sequence 1)
      billing_cycles.push({
        frequency: { interval_unit: 'DAY', interval_count: 7 }, // 7-day trial
        tenure_type: 'TRIAL',
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: {
          fixed_price: {
            value: '0',
            currency_code: 'USD',
          },
        },
      });
      // Then regular billing cycle (sequence 2)
      billing_cycles.push({
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 2,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: amount.toString(),
            currency_code: 'USD',
          },
        },
      });
    } else {
      // No trial — only regular billing cycle (sequence 1)
      billing_cycles.push({
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: amount.toString(),
            currency_code: 'USD',
          },
        },
      });
    }

    // 4) Create billing plan
    const plan = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/plans`,
      {
        product_id: product.data.id,
        name: `Subscription for $${amount}`,
        billing_cycles,
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 1,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 5) Create subscription (user must approve via approval link)
    const subscription = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        plan_id: plan.data.id,
        custom_id: userEmail,
        application_context: {
          brand_name: 'melody',
          user_action: 'SUBSCRIBE_NOW',
          return_url: 'http://localhost:3000/success',
          cancel_url: 'http://localhost:3000/cancel',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const approvalLink = subscription.data.links.find((link: any) => link.rel === 'approve');

    if (!approvalLink) {
      throw new AppError(500, 'Approval link not found');
    }

    // 6) If we gave trial, mark hasUsedTrial = true so user cannot get trial again later
    //    If user upgraded and trial was cancelled earlier, already marked true.
    if (giveTrial) {
      await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true }).catch(() => { });
    }

    // 7) Optionally save subscriptionId & planId locally (commented out)
    try {
      // await User.findByIdAndUpdate(
      //   user._id,
      //   {
      //     paypalSubscriptionId: subscription.data.id || null,
      //     paypalPlanId: plan.data.id || null,
      //   },
      //   { new: true, runValidators: true }
      // );
    } catch (e) {
      console.warn('⚠️ Failed to save paypalSubscriptionId/paypalPlanId locally:', (e as any)?.message || e);
    }

    return { url: approvalLink.href, subscriptionId: subscription.data.id, planId: plan.data.id, trialGiven: giveTrial };
  } catch (error: any) {
    console.error('❌ Paypal Subscription Error:', error.response?.data || error.message);
    throw new AppError(500, error.response?.data?.message || error.message);
  }
};


const paypalSubscriptionCancel = async (subscriptionId: string) => {
  const accessToken = await generateAccessToken();

  console.log(103, subscriptionId);


  try {
    const subRes = await axios.get(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const planId = subRes.data.plan_id;
    // 2️⃣ Cancel the subscription
    await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        reason: "User manually cancelled the subscription",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Subscription cancelled successfully:", subscriptionId);

    // 3️⃣ Deactivate the plan
    await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${planId}/deactivate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("🛑 Plan deactivated successfully:", planId);

    const nextBillingTime = subRes.data.billing_info?.next_billing_time;
    console.log("🕒 Raw nextBillingTime from webhook:", nextBillingTime);

    let endDate: Date | null = null;
    if (nextBillingTime && !isNaN(Date.parse(nextBillingTime))) {
      endDate = new Date(nextBillingTime);
    }

    const res = await User.findOneAndUpdate(
      { paypalSubscriptionId: subscriptionId },
      {
        $set: {
          subscriptionEndDate: endDate,
          cancelRequest: true
        },
      },
      { new: true, runValidators: true }
    );
    if (res) {
      console.log("cancel res", res);

      await paypalSubscriptionCencelEmailNoti(res?.email, res?.name)
    }



    return { success: true };
  } catch (error: any) {
    console.error("❌ Error cancelling subscription or deactivating plan:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message);
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

    // ================== when a user purses pack then call this  hook
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

      await Promise.all(
        payoutList.map(async (item) => {
          try {
            await sendPayoutToEmail(item.paypalEmail, item.payoutAmount);
            const user = await User.findById(item.producerId).select("email fullName _id producer_name");

            if (user) {
              const transaction = {
                userId: user._id,
                name: user.producer_name,
                email: user.email,
                salesAmount: item.payoutAmount,
                commission: item.platformFee,
              };
              await Transactions.create(transaction);
              console.log("✅ Transaction recorded for:", user.email);
            } else {
              console.warn("⚠️ User not found for producerId:", item.producerId);
            }
          } catch (err: any) {
            console.error("❌ Payout or transaction failed:", err.message);
          }
        })
      );
    }

    // =================== this is subscription hook
    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subscriptionId = event.resource.id;
      const planId = event.resource.plan_id;
      const paypalEmail = event.resource.subscriber.email_address;
      const customEmail = event.resource.custom_id;
      const name = `${event.resource.subscriber.name.given_name} ${event.resource.subscriber.name.surname}`;
      const amount = event.resource.billing_info?.last_payment?.amount?.value;

      console.log({ amount });



      const subscribedUserData = await User.findOne({ email: customEmail });
      if (!subscribedUserData) throw new AppError(httpStatus.NOT_FOUND, 'User is not found');

      // const userData = await User.findOne({ paypalEmail }).select("paypalSubscriptionId")
      // after testing remove this line, ( this api and subscribedUserData this same)

      if (subscribedUserData?.paypalSubscriptionId) {
        const existingSubId = subscribedUserData?.paypalSubscriptionId;
        try {
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


          const subRes = await axios.get(
            `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${existingSubId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const planId = subRes.data.plan_id;

          // Deactivate Plan
          await axios.post(
            `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${planId}/deactivate`,
            {},
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
        { email: subscribedUserData.email },
        {
          isPro: true,
          paypalSubscriptionId: subscriptionId,
          paypalPlanId: planId,
          subscribedAmount: parseInt(amount) | 0,
          paymentMethod: "paypal"
        },
        { new: true, runValidators: true }
      )

      await User.findOneAndUpdate(
        { email: subscribedUserData.email },
        { $unset: { subscriptionEndDate: "", cancelRequest : false } },
        { new: true, runValidators: true }
      );


      const transaction = {
        email: subscribedUserData.email,
        name: subscribedUserData.producer_name,
        userId: subscribedUserData._id,
        subscriptionAmount: parseInt(amount) | 0,
        invoiceURL: "N/A",
        salesAmount: 0,
        commission: 0,
      };

      console.log({ transaction });

      await Transactions.create(transaction);
      if (transaction.subscriptionAmount === 0) {
        await freeTrialEmailNotification(transaction.email)
      } else {
        await paymentSucceededEmail(transaction.email)
      }
    }



    // ===================== auto pay data store 
    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
      const amount = event.resource.amount?.total;
      const billingAgreementId = event.resource.billing_agreement_id;

      const user = await User.findOne({ paypalSubscriptionId: billingAgreementId });

      if (!user) {
        console.warn("⚠️ No user found for recurring subscription:", billingAgreementId);
        return;
      }

      const transaction = {
        email: user.email,
        name: user.producer_name,
        userId: user._id,
        subscriptionAmount: parseInt(amount) | 0,
        salesAmount: 0,
        commission: 0,
      };

      const res = await Transactions.create(transaction);

      if (res) {
        await paymentSucceededEmail(user.email)
      }
      console.log("✅ Monthly subscription payment logged for:", user.email);



    }


    if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      const subscriptionId = event.resource.id;
      const res = await User.findOneAndUpdate({ paypalSubscriptionId: subscriptionId }, {
        isPro: false,
        paypalSubscriptionId: null,
        paypalPlanId: null,
        subscribedAmount: 0,
      });
      console.log("❌ Subscription & Plan cancelled:", subscriptionId);
      if (res) {
        await subscriptionScheduleCanceledEmail(res.email, res.name)
      }
    }

    // =================== subscription canseled or ( amount not available then subscription auto cansel )
    if (event.event_type === "BILLING.SUBSCRIPTION.SUSPENDED") {
      const subscriptionId = event.resource.id;

      console.log("🚫 Subscription Suspended (likely due to failed payment):", subscriptionId);

      const user = await User.findOne({ paypalSubscriptionId: subscriptionId });

      if (user) {
        await User.findByIdAndUpdate(user._id, {
          isPro: false,
          paypalSubscriptionId: null,
          paypalPlanId: null,
          subscribedAmount: 0,
        });

        try {
          await axios.post(
            `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
            { reason: "Payment failed multiple times" },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("✅ Suspended subscription canceled :", subscriptionId);
        } catch (err: any) {
          console.error("❌ Failed to cancel suspended subscription:", err.response?.data || err.message);
        }

        const subRes = await axios.get(
          `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const planId = subRes.data.plan_id;

        // Deactivate Plan
        await axios.post(
          `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${planId}/deactivate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        // =========== need to set here cancel subscription email notification 
        await stripePaymentFailedEmail(user?.email)

        console.log("📉 User downgraded due to payment failure:", user.email);
      } else {
        console.warn("⚠️ No user found for suspended subscription:", subscriptionId);
      }
    }


    if (event.event_type === "PAYMENT.SALE.DENIED") {
      const payment = event.resource;
      const amount = payment.amount?.value;
      const userEmail = event.resource.custom_id; // if you passed it during creation

      console.warn("🚫 Payment Denied for:", userEmail, "Amount:", amount);

      const user = await User.findOne({ email: userEmail });
      if (user) {

        await User.findByIdAndUpdate(user._id, {
          isPro: false,
          paypalSubscriptionId: null,
          paypalPlanId: null,
          subscribedAmount: 0,
        });

        // Optional: cancel subscription too
        if (user.paypalSubscriptionId) {
          const subscriptionId = user.paypalSubscriptionId
          try {
            await axios.post(
              `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
              { reason: "Payment failed multiple times" },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );
            console.log("✅ Suspended subscription canceled :", subscriptionId);
          } catch (err: any) {
            console.error("❌ Failed to cancel suspended subscription:", err.response?.data || err.message);
          }

          const subRes = await axios.get(
            `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const planId = subRes.data.plan_id;

          // Deactivate Plan
          await axios.post(
            `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${planId}/deactivate`,
            {},
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        }

        await paypalPaymentSaleDeniedNotification(user.email, user.name, amount)

      }

      // Optionally: Send email alert to the user
    }

    return 200;
  } catch (err: any) {
    console.error('❌ Webhook Handling Error:', err?.response?.data || err.message);
    return 500;
  }
};


export const paymentService = {
  paypalSubscription,
  paypalSubscriptionCancel,
  createOrderWithPaypal,
  captureOrder,
  webhookEvent
};














// ============== gpt comment 
// const paypalSubscription = async (amount: number, userEmail: string) => {
//   const accessToken = await generateAccessToken();

//   try {
//     // 1) Find user in DB
//     const user = await User.findOne({ email: userEmail });
//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     // If user already used trial -> do NOT give trial
//     // If user has started a trial subscription previously but hasUsedTrial flag is false (edge case),
//     // and they now call this function to start paid immediately, we'll cancel existing and mark hasUsedTrial = true.
//     let giveTrial = user.hasUsedTrial; // if undefined -> treated as false => giveTrial = true

//     console.log({giveTrial});
    

//     // If user has an existing paypalSubscriptionId and hasn't been marked hasUsedTrial,
//     // we assume they started a trial earlier — user wants to upgrade now:
//     if (user.paypalSubscriptionId && user.hasUsedTrial) {
//       console.log('User has existing subscription (likely trial). Cancelling trial to start paid subscription now.');
//       try {
//         // Cancel the existing subscription
//         await axios.post(
//           `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
//           { reason: 'User upgraded from trial to paid subscription.' },
//           {
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         // fetch its plan id to deactivate
//         const subRes = await axios.get(
//           `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}`,
//           {
//             headers: { Authorization: `Bearer ${accessToken}` },
//           }
//         );
//         const oldPlanId = subRes.data.plan_id;
//         if (oldPlanId) {
//           await axios.post(
//             `${process.env.PAYPAL_API_BASE}/v1/billing/plans/${oldPlanId}/deactivate`,
//             {},
//             {
//               headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json',
//               },
//             }
//           );
//         }

//         // mark hasUsedTrial so user never gets trial again
//         await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true });

//         // after cancelling, we will NOT give trial for the new plan
//         giveTrial = false;
//       } catch (cancelErr: any) {
//         console.warn('⚠️ Failed to cancel existing trial subscription:', cancelErr?.response?.data || cancelErr?.message);
//         // proceed anyway to create a paid plan (but inform via logs)
//         giveTrial = false;
//         await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true }).catch(() => { });
//       }
//     }

//     // 2) Create product
//     const product = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/catalogs/products`,
//       {
//         name: 'Dynamic Subscription Product',
//         type: 'SERVICE',
//         category: 'SOFTWARE',
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // 3) Build billing_cycles based on giveTrial flag
//     const billing_cycles: any[] = [];

//     if (!giveTrial) {
//       billing_cycles.push({
//         frequency: { interval_unit: 'DAY', interval_count: 7 }, // 7-day trial
//         tenure_type: 'TRIAL',
//         sequence: 1,
//         total_cycles: 1,
//         pricing_scheme: {
//           fixed_price: {
//             value: '0',
//             currency_code: 'USD',
//           },
//         },
//       });
//       // Regular cycle will be sequence 2
//       billing_cycles.push({
//         frequency: { interval_unit: 'MONTH', interval_count: 1 },
//         tenure_type: 'REGULAR',
//         sequence: 2,
//         total_cycles: 0,
//         pricing_scheme: {
//           fixed_price: {
//             value: amount.toString(),
//             currency_code: 'USD',
//           },
//         },
//       });
//     } else {
//       // No trial — only regular cycle (sequence 1)
//       billing_cycles.push({
//         frequency: { interval_unit: 'MONTH', interval_count: 1 },
//         tenure_type: 'REGULAR',
//         sequence: 1,
//         total_cycles: 0,
//         pricing_scheme: {
//           fixed_price: {
//             value: amount.toString(),
//             currency_code: 'USD',
//           },
//         },
//       });
//     }

//     const plan = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/plans`,
//       {
//         product_id: product.data.id,
//         name: `Subscription for $${amount}`,
//         billing_cycles,
//         payment_preferences: {
//           auto_bill_outstanding: true,
//           payment_failure_threshold: 1,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // 4) Create subscription (user will have to approve it via returned approval link)
//     const subscription = await axios.post(
//       `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
//       {
//         plan_id: plan.data.id,
//         custom_id: userEmail,
//         application_context: {
//           brand_name: 'melody',
//           user_action: 'SUBSCRIBE_NOW',
//           return_url: 'http://localhost:3000/success',
//           cancel_url: 'http://localhost:3000/cancel',
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const approvalLink = subscription.data.links.find((link: any) => link.rel === 'approve');

//     if (!approvalLink) {
//       throw new AppError(500, 'Approval link not found');
//     }

//     // 5) Mark hasUsedTrial true if we gave trial (so user won't get trial again later)
//     //    Also, if we forced cancellation because user upgraded, we already set hasUsedTrial = true earlier.
//     if (!giveTrial) {
//       await User.findByIdAndUpdate(user._id, { hasUsedTrial: true }, { new: true, runValidators: true }).catch(() => { });
//     }

//     // 6) Save the created subscription id & plan id (optional — webhook will also update on activation)
//     try {
//       // await User.findByIdAndUpdate(
//       //   user._id,
//       //   {
//       //     paypalSubscriptionId: subscription.data.id || null,
//       //     paypalPlanId: plan.data.id || null,
//       //   },
//       //   { new: true, runValidators: true }
//       // );
//     } catch (e) {
//       console.warn('⚠️ Failed to save paypalSubscriptionId/paypalPlanId locally:', (e as any)?.message || e);
//     }

//     return { url: approvalLink.href, subscriptionId: subscription.data.id, planId: plan.data.id, trialGiven: giveTrial };
//   } catch (error: any) {
//     console.error('❌ Paypal Subscription Error:', error.response?.data || error.message);
//     throw new AppError(500, error.response?.data?.message || error.message);
//   }
// };
// ================ this is my code, 
// there is a condetional subscription plan , the condetion is, if any user want to subscrib first time then he will get 7 days free trial, soo how we  know which user take this or not, 
// follow this field ( let giveTrial = user.hasUsedTrial ) initial value is false, if value is false the the user will get the free trial but if value is true then the user can't take the free trial, other code work perfectly, just you fixed this condetion 