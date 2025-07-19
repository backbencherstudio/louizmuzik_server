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


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);


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

    // Cancel any active subscriptions
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
      recurring: { interval: "day" },
      product: product.id,
    });

    // Create subscription with metadata
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        email,
        name,
        userId,
        amount: amount.toString(),
        paymentMethodId,
      },
      expand: ["latest_invoice.payment_intent"],
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

    // ✅ Add metadata to payment intent
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

    // ✅ Update user in MongoDB
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          customerId,
          subscriptionId: subscription.id,
          isPro: true,
          subscribedAmount: amount,
        },
      },
      { new: true, runValidators: true }
    );

    // ✅ Save transaction record
    await Transactions.create({
      email: user.email,
      name: user.producer_name,
      userId: user._id,
      subscriptionAmount: amount,
      salesAmount: 0,
      commission: 0,
    });

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
    "invoice.payment_succeeded": handleInvoicePaymentSucceeded,
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
  const schedule = event?.data?.object as Stripe.SubscriptionSchedule;
  const { email, userId } = schedule.metadata || {};
  // console.log(`🗓️ Subscription schedule canceled for ${email}`);

  // await User.findByIdAndUpdate(userId, {
  //   isPro: false,
  //   subscriptionStatus: "canceled",
  //   subscriptionId: null,
  // });
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
  const subscription = event?.data?.object as Stripe.Subscription;
  const { email, userId } = subscription?.metadata || {};
  console.log(`🗑️ Subscription deleted for ${email}`);

  // await User.findByIdAndUpdate(userId, {
  //   isPro: false,
  //   subscriptionId: null,
  //   // subscriptionStatus: "deleted",
  // });
};

// const handleInvoicePaymentSucceeded = async (event: Stripe.Event) => {
//   const invoice = event?.data?.object as Stripe.Invoice;
//   const { email, name, userId, amount } = invoice?.metadata || {};
//   console.log(`💰 Payment succeeded for ${email}, amount: ${amount}`);

//   // await User.findByIdAndUpdate(userId, {
//   //   isPro: true,
//   //   subscribedAmount: parseFloat(amount),
//   // });

//   // await Transactions.create({
//   //   email,
//   //   name,
//   //   userId,
//   //   subscriptionAmount: parseFloat(amount),
//   //   salesAmount: 0,
//   //   commission: 0,
//   // });
// };

const handleInvoicePaymentSucceeded = async (event: Stripe.Event) => {
  const invoice = event?.data?.object as Stripe.Invoice;

  const email =
    invoice?.metadata?.email ||
    invoice?.customer_email ||
    "unknown@email.com";

  const name = invoice?.metadata?.name || "unknown";
  const userId = invoice?.metadata?.userId || "unknown";
  const amount = invoice?.metadata?.amount || (invoice?.amount_paid / 100);

  console.log(`💰 Payment succeeded for ${email}, amount: ${amount}`);

  // Optional: Save to DB
  // await User.findByIdAndUpdate(userId, {
  //   isPro: true,
  //   subscribedAmount: parseFloat(amount),
  // });

  // await Transactions.create({
  //   email,
  //   name,
  //   userId,
  //   subscriptionAmount: parseFloat(amount),
  //   salesAmount: 0,
  //   commission: 0,
  // });
};


export const stripeSubscriptionService = {
    stripeSubscription,
    stripeWebhook
}






// /* eslint-disable @typescript-eslint/no-explicit-any */
// import Stripe from "stripe";
// import { User } from "../User/user.model";
// import { Transactions } from "./payment.module";
// import { AppError } from "../../errors/AppErrors";
// import httpStatus from "http-status";


// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);


// const stripeSubscription = async (
//     req: { body: { email: string; amount: number; paymentMethodId: string, name : string, userId : string } },
//     res: any
// ) => {
//     const { email, amount, paymentMethodId, name, userId } = req.body;

//     if (!email || !amount || !paymentMethodId) {
//         return res.status(400).send({
//             error: `Email, amount, and payment method are required.`,
//         });
//     }

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).send({ error: "User not found." });
//         }

//         if (user.customerId) {
//             const subscriptions = await stripe.subscriptions.list({
//                 customer: user.customerId,
//                 status: "active",
//             });

//             for (const subscription of subscriptions.data) {
//                 await stripe.subscriptions.update(subscription.id, {
//                     cancel_at_period_end: true,
//                 });
//                 console.log(`Marked subscription ${subscription.id} for cancellation at period end for user ${email}`);
//             }
//         }

//         let customerId = user.customerId;
//         if (!customerId) {
//             const customer = await stripe.customers.create({
//                 name,
//                 email,
//                 payment_method: paymentMethodId,
//                 invoice_settings: {
//                     default_payment_method: paymentMethodId,
//                 },
//             });
//             customerId = customer.id;
//         }

//         const product = await stripe.products.create({
//             name: `Subscription for ${email}`,
//         });

//         const price = await stripe.prices.create({
//             unit_amount: amount * 100,
//             currency: "usd",
//             recurring: { interval: "day" },
//             product: product.id,
//         });

//         const subscription = await stripe.subscriptions.create({
//             customer: customerId,
//             items: [{ price: price.id }],
//             expand: ["latest_invoice.payment_intent"],
//         });

//         const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
//         const invoicePdf =
//             latestInvoice && typeof latestInvoice !== "string"
//                 ? latestInvoice.invoice_pdf
//                 : null;

        
//         const subscribedUserData = await User.findOne({email})
//         if (!subscribedUserData) throw new AppError(httpStatus.NOT_FOUND, 'User is not found');

//         await User.findOneAndUpdate(
//             { email },
//             {
//                 $set: {
//                     customerId,
//                     subscriptionId: subscription.id,
//                     isPro: true,
//                     subscribedAmount: amount
//                 },
//             },
//             { new: true, runValidators: true }
//         );

//         const transaction = {
//             email: subscribedUserData.email,
//             name: subscribedUserData.producer_name,
//             userId: subscribedUserData._id,
//             subscriptionAmount: amount,
//             salesAmount: 0,
//             commission: 0,
//         };
//         await Transactions.create(transaction);

//         res.status(200).send({
//             subscriptionId: subscription.id,
//             clientSecret: (latestInvoice?.payment_intent as Stripe.PaymentIntent)?.client_secret || null,
//             customerId,
//         });
//     } catch (error: any) {
//         console.error("Error creating subscription:", error);
//         res.status(500).send({ error: "Failed to create subscription." });
//     }
// };




// export const stripeSubscriptionService = {
//     stripeSubscription
// }