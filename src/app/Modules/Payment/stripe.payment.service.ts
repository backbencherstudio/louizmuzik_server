/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { User } from "../User/user.model";
import { Transactions } from "./payment.module";
import config from "../../config";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { paymentSucceededEmail } from "../../utils/paymentSucceededEmail";
import { stripePaymentFailedEmail } from "../../utils/stripePaymentFailedEmail";
import { subscriptionScheduleCanceledEmail } from "../../utils/subscriptionScheduleCanceledEmail";
import { freeTrialEmailNotification } from "../../utils/freeTrialEmailNotification";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.sender_email,
    pass: config.email_pass,
  },
});


const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  try {
    await transporter.sendMail({
      from: config.sender_email,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to} with subject "${subject}"`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

// const stripeSubscription = async (
//   req: {
//     body: {
//       email: string;
//       amount: number;
//       paymentMethodId: string;
//       name: string;
//       userId: string;
//     };
//   },
//   res: any
// ) => {
//   const { email, amount, paymentMethodId, name, userId } = req.body;
//   if (!email || !amount || !paymentMethodId) {
//     return res.status(400).send({
//       error: "Email, amount, and payment method are required.",
//     });
//   }
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).send({ error: "User not found." });
//     }

//     // Cancel any active subscriptions
//     if (user.customerId) {
//       const subscriptions = await stripe.subscriptions.list({
//         customer: user.customerId,
//         status: "active",
//       });

//       for (const subscription of subscriptions.data) {
//         await stripe.subscriptions.update(subscription.id, {
//           cancel_at_period_end: true,
//         });
//         console.log(`⛔ Subscription ${subscription.id} canceled for ${email}`);
//       }

//       await stripe.customers.update(user.customerId, { name });
//     }

//     let customerId = user.customerId;

//     // Create Stripe customer if not exists
//     if (!customerId) {
//       const customer = await stripe.customers.create({
//         name,
//         email,
//         payment_method: paymentMethodId,
//         invoice_settings: {
//           default_payment_method: paymentMethodId,
//         },
//         metadata: {
//           email,
//           name,
//           userId,
//           amount: amount.toString(),
//           paymentMethodId,
//         },
//       });

//       customerId = customer.id;
//     }

//     // Create product
//     const product = await stripe.products.create({
//       name: `Subscription for ${email}`,
//     });

//     // Create price
//     const price = await stripe.prices.create({
//       unit_amount: amount * 100,
//       currency: "usd",
//       recurring: { interval: "day" },
//       product: product.id,
//     });

//     // Create subscription with metadata
//     const subscription = await stripe.subscriptions.create({
//       customer: customerId,
//       items: [{ price: price.id }],
//       trial_period_days: 1,
//       metadata: {
//         email,
//         name,
//         userId,
//         amount: amount.toString(),
//         paymentMethodId,
//       },
//       expand: ["latest_invoice.payment_intent"],
//     });

//     const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
//     const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

//     // ✅ Add metadata to payment intent
//     if (paymentIntent?.id) {
//       await stripe.paymentIntents.update(paymentIntent.id, {
//         metadata: {
//           email,
//           name,
//           userId,
//           amount: amount.toString(),
//           paymentMethodId,
//         },
//       });
//     }

//     // ✅ Update user in MongoDB
//     await User.findOneAndUpdate(
//       { email },
//       {
//         $set: {
//           customerId,
//           subscriptionId: subscription.id,
//           isPro: true,
//           subscribedAmount: amount,
//         },
//       },
//       { new: true, runValidators: true }
//     );
//     return res.status(200).send({
//       subscriptionId: subscription.id,
//       clientSecret: paymentIntent?.client_secret || null,
//       customerId,
//     });
//   } catch (error: any) {
//     console.error("🚨 Error creating subscription:", error);
//     return res.status(500).send({ error: "Failed to create subscription." });
//   }
// };


const stripeSubscription = async (
  req: {
    body: {
      email: string;
      amount: number;
      paymentMethodId: string;
      name: string;
      userId: string;
    };
  },
  res: any
) => {
  const { email, amount, paymentMethodId, name, userId } = req.body;

  if (!email || !amount || !paymentMethodId) {
    return res.status(400).send({
      error: "Email, amount, and payment method are required.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    // Cancel any existing subscriptions
    if (user.customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.customerId,
        status: "active",
      });

      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
        console.log(`⛔ Subscription ${subscription.id} canceled for ${email}`);
      }

      await stripe.customers.update(user.customerId, { name });
    }

    let customerId = user.customerId;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        name,
        email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          email,
          name,
          userId,
          amount: amount.toString(),
          paymentMethodId,
        },
      });

      customerId = customer.id;
    }

    // Create product
    const product = await stripe.products.create({
      name: `Subscription for ${email}`,
    });

    // Create price
    const price = await stripe.prices.create({
      unit_amount: amount * 100,
      currency: "usd",
      recurring: { interval: "day" }, // Change to "month" or "year" if needed
      product: product.id,
    });

    // trial logic
    const isEligibleForTrial = !user.hasUsedTrial;
    const trialDays = isEligibleForTrial ? 1 : 0;    // in production mood need to change trial day

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      trial_period_days: trialDays,
      metadata: {
        email,
        name,
        userId,
        amount: amount.toString(),
        paymentMethodId,
        trialUsed: isEligibleForTrial ? "yes" : "no",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

    // Add metadata to payment intent
    if (paymentIntent?.id) {
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          email,
          name,
          userId,
          amount: amount.toString(),
          paymentMethodId,
        },
      });
    }

    // Update user in MongoDB
    if (customerId) {
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            customerId,
            subscriptionId: subscription.id,
            isPro: true,
            subscribedAmount: amount,
            hasUsedTrial: true,
            cancelRequest: false,
            paymentMethod: "stripe"
          },
        },
        { new: true, runValidators: true }
      );
    }
    return res.status(200).send({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || null,
      customerId,
    });
  } catch (error: any) {
    console.error("🚨 Error creating subscription:", error);
    return res.status(500).send({ error: "Failed to create subscription." });
  }
};



// const cancelSubscription = async (req: Request, res: Response) => {
//   const { customerId } = req.params;

//   console.log(customerId);


//   try {
//     const user = await User.findOne({ customerId });
//     if (!user || !user.customerId) {
//       return res.status(404).json({ error: "User or subscription not found." });
//     }

//     const subscriptions = await stripe.subscriptions.list({
//       customer: user.customerId,
//       status: "active",
//     });

//     if (subscriptions.data.length === 0) {
//       return res.status(404).json({ error: "No active subscription found." });
//     }

//     const subscriptionId = subscriptions.data[0].id;

//     const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
//       cancel_at_period_end: true,
//     });

//     await User.findByIdAndUpdate({ _id: user._id }, { $set: { cancelRequest: true } }, { new: true, runValidators: true })

//     const textContent = `
//       Hello,

//       Your subscription has been successfully set to cancel at the end of the current billing period. If you have any questions or wish to resubscribe, please feel free to contact us.

//       Thank you for being with us,
//       – The Team
//     `;

//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
//         <div style="background-color: #f44336; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
//           <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Subscription Set to Cancel</h1>
//         </div>
//         <div style="padding: 20px;">
//           <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
//             Hello,
//           </p>
//           <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
//             Your subscription has been successfully set to <strong>cancel</strong> at the end of the current billing period.
//           </p>
//           <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
//             If you have any questions or wish to resubscribe in the future, please feel free to contact us at any time.
//           </p>
//           <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
//             Thank you for being with us,
//           </p>
//           <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px; font-weight: bold;">
//             – The Team
//           </p>
//         </div>
//         <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #888888;">
//           <p style="margin: 0;">
//             If you have any questions, feel free to <a href="mailto:rentpadhomesteam@gmail.com" style="color: #0d6efd; text-decoration: none;">contact us</a>.
//           </p>
//           <p style="margin: 10px 0 0;">&copy; ${new Date().getFullYear()} The Team. All rights reserved.</p>
//         </div>
//       </div>
//     `;

//     await sendEmail(
//       user.email,
//       "Subscription Set to Cancel",
//       textContent,
//       htmlContent
//     );

//     console.log(`Subscription set to cancel at period end for user: ${user.email}`);
//     res.status(200).json({
//       message: "Subscription successfully set to cancel at the end of the current billing period.",
//       subscriptionId: canceledSubscription.id,
//     });
//   } catch (error: any) {
//     console.error("Error canceling subscription:", error);
//     res.status(500).json({ error: "Failed to cancel subscription." });
//   }
// };


const cancelSubscription = async (req: Request, res: Response) => {
  const { customerId } = req.params;

  console.log(customerId);

  try {
    const user = await User.findOne({ customerId });
    if (!user || !user.customerId) {
      return res.status(404).json({ error: "User or subscription not found." });
    }

    // Fetch all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
    });

    // Find the one with status trialing or active
    const subscription = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (!subscription) {
      return res.status(404).json({ error: "No active or trialing subscription found." });
    }

    // Cancel at period end
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    // Update user state in DB
    await User.findByIdAndUpdate(
      { _id: user._id },
      { $set: { cancelRequest: true, nextBillingTime: "N/A" } },
      { new: true, runValidators: true }
    );

    console.log(451, { subscription });
    console.log(452, subscription?.status);


    if (subscription.status === "trialing") {
      await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { isPro: false, nextBillingTime: "N/A" } },
        { new: true, runValidators: true }
      );
    }



    // Email content
    const textContent = `
      Hello,

      Your subscription has been successfully set to cancel at the end of the current billing period. If you have any questions or wish to resubscribe, please feel free to contact us.

      Thank you for being with us,
      – The Team
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #f44336; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Subscription Set to Cancel</h1>
        </div>
        <div style="padding: 20px;">
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello,
          </p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Your subscription has been successfully set to <strong>cancel</strong> at the end of the current billing period.
          </p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You will continue to have access to premium features until your trial or billing period ends.
          </p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for being with us,
          </p>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; font-weight: bold;">
            – The Team
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #888888;">
          <p style="margin: 0;">
            If you have any questions, feel free to <a href="mailto:rentpadhomesteam@gmail.com" style="color: #0d6efd; text-decoration: none;">contact us</a>.
          </p>
          <p style="margin: 10px 0 0;">&copy; ${new Date().getFullYear()} The Team. All rights reserved.</p>
        </div>
      </div>
    `;



    await sendEmail(
      user.email,
      "Subscription Set to Cancel",
      textContent,
      htmlContent
    );

    console.log(`✅ Subscription set to cancel at period end for user: ${user.email}`);
    res.status(200).json({
      message: "Subscription successfully set to cancel at the end of the current billing period.",
      subscriptionId: canceledSubscription.id,
    });
  } catch (error: any) {
    console.error("❌ Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription." });
  }
};



const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = config.stripe_webhook_secret_key;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret as string);
  } catch (err: any) {
    console.error("❌ Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventHandlers: { [key: string]: (event: Stripe.Event) => Promise<void> } = {
    "customer.subscription.created": handleSubscriptionUpdated,
    "customer.subscription.updated": handleSubscriptionUpdated,
    "customer.subscription.deleted": handleSubscriptionDeleted,
    "invoice.payment_succeeded": handleInvoicePaymentSucceeded, // Triggered when renewal is successful
    "invoice.payment_failed": handlePaymentFailed,
    "invoice.upcoming": handleInvoiceUpcoming,
    "subscription_schedule.canceled": handleSubscriptionCanceled,
    "invoice.finalized": handleInvoiceFinalized,
  };

  const handler = eventHandlers[event.type];
  if (handler) {
    try {
      await handler(event);
    } catch (err) {
      console.error(`❌ Error handling ${event.type}:`, err);
      return res.status(500).send("Webhook handler error");
    }
  } else {
    console.log(`⚠️ Unhandled event: ${event.type}`);
  }

  res.status(200).json({ received: true });
};



const handleInvoiceUpcoming = async (event: Stripe.Event) => {
  const invoice = event?.data?.object as Stripe.Invoice;
  const { email, amount } = invoice?.metadata || {};
  console.log(`📅 Upcoming invoice for ${email}, amount: ${amount}`);
};


const handlePaymentFailed = async (event: Stripe.Event) => {

  const invoice = event?.data?.object as Stripe.Invoice;
  const { email } = invoice?.metadata || {};
  console.log(`❌ Payment failed for ${email}`);

  if (email) {
    await User.findOneAndUpdate({ email }, {
      isPro: false,
      subscriptionId: null,
      subscribedAmount: 0,
      nextBillingTime: "N/A"
    });

    await stripePaymentFailedEmail(email)
  }





};

const handleSubscriptionUpdated = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;

  const { email, userId, amount } = subscription?.metadata || {};

  console.log("🔄 Subscription updated:");
  console.log("Email:", email);
  console.log("User ID:", userId);
  console.log("Amount:", amount);

  // Example update logic
  // if (email && userId) {
  //   await User.findByIdAndUpdate(userId, {
  //     isPro: subscription.status === "active",
  //     subscribedAmount: parseFloat(amount),
  //   });
  // }
};



const handleSubscriptionCanceled = async (event: Stripe.Event) => {
  const subscription = event?.data?.object as Stripe.Subscription;
  const customerId = subscription?.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const metadata = customer.metadata || {};

  const userId = metadata?.userId || 'N/A';
  const email = metadata?.email || 'N/A';
  const name = metadata?.name || 'N/A';

  console.log("schedule cancel === ", userId);


  await User.findByIdAndUpdate({ _id: userId }, {
    isPro: false,
    subscriptionId: null,
    subscribedAmount: 0,
    nextBillingTime: "N/A"
  });

  await subscriptionScheduleCanceledEmail(email, name)
};

// const handleInvoiceFinalized = async (event: Stripe.Event) => {
//   const invoice = event?.data?.object as Stripe.Invoice;
//   const { email, amount } = invoice.metadata || {};
//   console.log(`📄 Invoice finalized for ${email}, amount: ${amount}`);
// };

const handleInvoiceFinalized = async (event: Stripe.Event) => {
  const invoice = event?.data?.object as Stripe.Invoice;

  const email = invoice?.metadata?.email || invoice?.customer_email || "unknown";
  const amount = invoice?.amount_paid || invoice?.amount_due || 0;

  console.log(`📄 Invoice finalized for ${email}, amount: ${amount / 100}`);
};


const handleSubscriptionDeleted = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const metadata = customer.metadata || {};

  const email = metadata.email || 'N/A';
  const name = metadata.name || 'N/A';
  const userId = metadata.userId || 'N/A';
  const amount = metadata.amount || '0';


  console.log("delete subsctiption", email);

  // await User.findByIdAndUpdate(userId, {
  //   isPro: false,
  //   subscriptionId: null,
  //   // subscriptionStatus: "deleted",
  // });


};


const handleInvoicePaymentSucceeded = async (event: Stripe.Event) => {
  // const invoice = event.data.object as Stripe.Invoice;
  // const subscription = event.data.object as Stripe.Subscription;
  // const customerId = subscription.customer as string;
  // const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  // const metadata = customer.metadata || {};
  // const invoiceURL = invoice.invoice_pdf || 'N/A';

  // const email = metadata.email || 'N/A';
  // const name = metadata.name || 'N/A';
  // const userId = metadata.userId || 'N/A';
  // const amount = metadata.amount || '0';
  // const trialUsed = metadata.trialUsed;

  // console.log({ metadata });
  // console.log({ trialUsed });

  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;

  // ✅ Fetch subscription directly to get trialUsed and other metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = subscription.metadata || {};

  const email = metadata.email || 'N/A';
  const name = metadata.name || 'N/A';
  const userId = metadata.userId || 'N/A';
  const amount = metadata.amount || '0';
  const trialUsed = metadata.trialUsed;
  const invoiceURL = invoice.invoice_pdf || 'N/A';

  console.log({ metadata });

  let nextInvoice = null;
  if (invoice.subscription && typeof invoice.subscription === "string") {
    try {
      nextInvoice = await stripe.invoices.retrieveUpcoming({
        subscription: invoice.subscription
      });

      console.log("💰 Next Amount Due:", (nextInvoice.amount_due ?? 0) / 100);
      console.log("⏳ Next Payment Date:", nextInvoice.next_payment_attempt
        ? new Date(nextInvoice.next_payment_attempt * 1000)
        : "N/A");
    } catch (err) {
      console.error("Error retrieving next invoice:", err);
    }
  }

  let nextBillingTime;
  if (nextInvoice) {
    nextBillingTime = nextInvoice.next_payment_attempt
      ? new Date(nextInvoice.next_payment_attempt * 1000) : "N/A" 
  }




  if (userId !== 'N/A') {
    const res = await User.findByIdAndUpdate({ _id: userId }, {
      // isPro: subscription.status === "active",
      isPro: true,
      subscribedAmount: parseFloat(amount),
      nextBillingTime
    });



    if (invoiceURL && trialUsed === "no") {
      await Transactions.create({
        email,
        name,
        userId,
        subscriptionAmount: amount,
        salesAmount: 0,
        commission: 0,
        invoiceURL
      });
    }

    if (trialUsed === "no") {
      await paymentSucceededEmail(email)
    } else {
      await freeTrialEmailNotification(email)
    }

  }


};


export const stripeSubscriptionService = {
  stripeSubscription,
  cancelSubscription,
  stripeWebhook
}

