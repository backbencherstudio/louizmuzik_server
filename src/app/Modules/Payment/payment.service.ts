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
import config from '../../config';
import { Pack } from '../Pack/pack.module';


const paypalSubscription = async (amount: number, userEmail: string) => {
  const accessToken = await generateAccessToken(); 
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    let giveTrial = !user.hasUsedTrial;
    if (user.paypalSubscriptionId && !user.hasUsedTrial) {
      console.log('User has existing subscription (likely trial). Cancelling trial to start paid subscription now.');
      try {
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
        giveTrial = false;
      } catch (cancelErr: any) {
        console.warn('⚠️ Failed to cancel existing trial subscription:', cancelErr?.response?.data || cancelErr?.message);
        giveTrial = false;
      }
    }
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
    const billing_cycles: any[] = [];

    if (giveTrial) {
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

    const subscription = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        plan_id: plan.data.id,
        custom_id: userEmail,
        application_context: {
          brand_name: 'melody',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${config.client_base_url}/success`, 
          cancel_url: `${config.client_base_url}/cancel`,
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
    const nextBillingTime = subRes.data.billing_info?.next_billing_time;
    let endDate: Date | null = null;
    if (nextBillingTime && !isNaN(Date.parse(nextBillingTime))) {
      endDate = new Date(nextBillingTime);
    }

    const res = await User.findOneAndUpdate(
      { paypalSubscriptionId: subscriptionId },
      {
        $set: {
          subscriptionEndDate: endDate,
          cancelRequest: true,
          nextBillingTime : "N/A"
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


interface ProducerUser {
  _id: string;
  producer_name: string;
  paypalEmail: string;
  email: string;
}

interface PopulatedPack {
  _id: string;
  name: string;
  price: number;
  userId: ProducerUser; // after populate
}


  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource = event.resource;
    const purchaseUnit = resource.purchase_units?.[0];
    const selectedDataRaw = purchaseUnit?.custom_id || resource?.custom_id;

    let selectedData: { userId: string; packId: string }[] = [];
    try {
      selectedData = JSON.parse(selectedDataRaw);
    } catch {
      console.warn("⚠️ Could not parse selectedData");
    }

    console.log(selectedData);
    

    const packIds = selectedData.map(
      (item) => new mongoose.Types.ObjectId(item.packId)
    );

    const packs = await Pack.find({ _id: { $in: packIds } })
      .populate<{ userId: ProducerUser }>(
        "userId",
        "paypalEmail producer_name email"
      )
      .lean<PopulatedPack[]>();

    const payoutList = packs.map((pack) => {
      const producer = pack.userId;
      const buyerUserId = selectedData?.[0]?.userId || null;

      const gross = pack.price || 0;
      const paypalFee = parseFloat((gross * 0.029 + 0.3).toFixed(2)) * 2;
      const afterPaypal = gross - paypalFee;
      const serviceFee = parseFloat((afterPaypal * 0.03).toFixed(2));
      const payout = parseFloat((afterPaypal - serviceFee).toFixed(2));

      return {
        userId: buyerUserId?.toString(),
        producerId: producer._id.toString(),
        packId: pack._id.toString(),
        producerName: producer.producer_name,
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

          const user = await User.findById(item.userId).select(
            "email fullName _id producer_name"
          );

          if (user) {
            const transaction = {
              name: user.producer_name,
              email: user.email,
              userId: user._id,
              packId: item.packId,
              producerId: item.producerId,
              salesAmount: item.payoutAmount,
              commission: item.platformFee,
              
            };

            await Transactions.create(transaction);
            console.log("✅ Transaction recorded for:", user.email);
          } else {
            console.warn("⚠️ Buyer not found for:", item.userId);
          }
        } catch (err: any) {
          console.error("❌ Payout or transaction failed:", err.message);
        }
      })
    );
  };


    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subscriptionId = event.resource.id;
      const planId = event.resource.plan_id;
      const customEmail = event.resource.custom_id;
      const amount = event.resource.billing_info?.last_payment?.amount?.value;

      const subscribedUserData = await User.findOne({ email: customEmail });
      if (!subscribedUserData) throw new AppError(httpStatus.NOT_FOUND, 'User is not found');
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

      const subRes = await axios.get(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const nextBillingTime = subRes.data.billing_info?.next_billing_time;

      await User.findOneAndUpdate(
        { email: subscribedUserData.email },
        {
          isPro: true,
          paypalSubscriptionId: subscriptionId,
          paypalPlanId: planId,
          subscribedAmount: parseInt(amount) | 0,
          paymentMethod: "paypal",
          nextBillingTime : nextBillingTime ? nextBillingTime : "N/A",
          hasUsedTrial : true,
          membershipDate : new Date()
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
       await User.findOneAndUpdate({ paypalSubscriptionId: subscriptionId }, {
        isPro: false,
        paypalSubscriptionId: null,
        paypalPlanId: null,
        subscribedAmount: 0,
        nextBillingTime : "N/A"
      });
      console.log("❌ Subscription & Plan cancelled:", subscriptionId);
    }

    if (event.event_type === "BILLING.SUBSCRIPTION.SUSPENDED") {
      const subscriptionId = event.resource.id;
      const user = await User.findOne({ paypalSubscriptionId: subscriptionId });
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          isPro: false,
          paypalSubscriptionId: null,
          paypalPlanId: null,
          subscribedAmount: 0,
          nextBillingTime : "N/A"
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
      const userEmail = event.resource.custom_id; 
      const user = await User.findOne({ email: userEmail });
      if (user) {

        await User.findByIdAndUpdate(user._id, {
          isPro: false,
          paypalSubscriptionId: null,
          paypalPlanId: null,
          subscribedAmount: 0,
          nextBillingTime : "N/A"
        });

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

