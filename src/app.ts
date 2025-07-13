/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';
import { generateAccessToken } from './app/middleware/generateAccessTokenForPaypal';
import axios from 'axios';

dotenv.config();
const app: Application = express();

app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

// Raw parser BEFORE express.json
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

app.use('/uploads', express.static('uploads'));
app.use(express.json());

app.use('/api/v1', router);


// ✅ Create product + plan + subscription dynamically
app.post("/subscribe", async (req, res) => {
  const { amount } = req.body;
  const accessToken = await generateAccessToken();

  try {
    // 1️⃣ Create Product
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

    // 2️⃣ Create Plan with passed amount
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

    // 3️⃣ Create Subscription
    const subscription = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        plan_id: plan.data.id,
        application_context: {
          brand_name: "Your Brand Name",
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

    const approvalLink = subscription.data.links.find(
      (link: { rel: string; }) => link.rel === "approve"
    );

    res.json({ url: approvalLink.href });
  } catch (err : any) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});









app.get('/', (req, res) => res.send({ message: 'Server running successfully' }));

app.use(globalErrorHandler);

export default app;


















// import express, { Application } from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import dotenv from 'dotenv';
// import router from './app/routes';
// import globalErrorHandler from './app/middleware/globalErrorHandlear';

// dotenv.config();
// const app: Application = express();

// app.use(cookieParser());

// app.use(cors({
//   origin: ['http://localhost:3000'],
//   credentials: true,
// }));

// // Raw parser BEFORE express.json
// app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

// app.use('/uploads', express.static('uploads'));
// app.use(express.json());

// app.use('/api/v1', router);

// app.get('/', (req, res) => res.send({ message: 'Server running successfully' }));

// app.use(globalErrorHandler);

// export default app;
