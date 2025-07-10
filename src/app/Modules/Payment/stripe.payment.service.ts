/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// const stripeSubscription = async (req : {body : {customerEmail : string, amount : number}}, res : any) => {
//     const {customerEmail, amount} = req.body
//     try {
//         // Create a customer (you can reuse if needed)
//         const customer = await stripe.customers.create({
//             email: customerEmail,
//         });

//         // Create a product
//         const product = await stripe.products.create({
//             name: `Dynamic Plan for ${customerEmail}`,
//         });

//         // Create price dynamically
//         const price = await stripe.prices.create({
//             unit_amount: Math.round(amount * 100), // amount in cents
//             currency: "usd",
//             recurring: { interval: "month" },
//             product: product.id,
//         });

//         // Create subscription
//         const subscription = await stripe.subscriptions.create({
//             customer: customer.id,
//             items: [{ price: price.id }],
//             payment_behavior: "default_incomplete",
//             expand: ["latest_invoice.payment_intent"],
//         });

//         res.send({
//             clientSecret: subscription.latest_invoice.payment_intent.client_secret,
//             subscriptionId: subscription.id,
//         });
//     } catch (err : any) {
//         console.error("Subscription error:", err);
//         res.status(500).send({ error: err.message });
//     }
// }

const stripeSubscription = async (
    req: { body: { customerEmail: string; amount: number } },
    res: any
) => {
    const { customerEmail, amount } = req.body;

    try {
        // Create a customer
        const customer = await stripe.customers.create({
            email: customerEmail,
        });

        // Create a product
        const product = await stripe.products.create({
            name: `Dynamic Plan for ${customerEmail}`,
        });

        // Create a price
        const price = await stripe.prices.create({
            unit_amount: Math.round(amount * 100),
            currency: "usd",
            recurring: { interval: "day" },
            product: product.id,
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: price.id }],
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
        });

        // Type narrowing and safety check
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const clientSecret =
            invoice?.payment_intent &&
            typeof invoice.payment_intent !== "string" &&
            invoice.payment_intent.client_secret;

        if (!clientSecret) {
            throw new Error("Failed to retrieve client secret.");
        }

        res.send({
            clientSecret,
            subscriptionId: subscription.id,
        });
    } catch (err: any) {
        console.error("Subscription error:", err);
        res.status(500).send({ error: err.message });
    }
};



export const stripeSubscriptionService = {
    stripeSubscription
}