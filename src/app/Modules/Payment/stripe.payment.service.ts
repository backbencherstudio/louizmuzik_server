
/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { User } from "../User/user.model";
import { Transactions } from "./payment.module";


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






export const stripeSubscriptionService = {
    stripeSubscription
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