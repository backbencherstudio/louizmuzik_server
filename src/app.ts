/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';

dotenv.config();

const app: Application = express();

// ===================
// Middleware Setup
// ===================
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

// ✅ Serve static files
app.use('/uploads', express.static('uploads'));

// ===================
// Webhook Setup (Must go BEFORE express.json())
// ===================
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Use live: 'https://api-m.paypal.com'

const generateAccessToken = async () => {
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

  return response.data.access_token;
};

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const rawBody = req.body.toString('utf8');
      const event = JSON.parse(rawBody);

      const webhookId = process.env.PAYPAL_WEBHOOK_ID;

      const {
        'paypal-transmission-id': transmissionId,
        'paypal-transmission-time': timestamp,
        'paypal-transmission-sig': webhookSig,
        'paypal-cert-url': certUrl,
        'paypal-auth-algo': authAlgo,
      } = req.headers;

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

      const isValid =
        verifyResponse.data.verification_status === 'SUCCESS';

      if (!isValid) {
        console.log('❌ Invalid webhook signature');
        return res.status(400).send('Invalid webhook');
      }

      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource;
        const amount = resource.amount?.value;
        const transactionId = resource.id;
        // const customId = resource?.supplementary_data?.related_ids?.order_id;
        const customId = resource?.custom_id;

        const purchaseUnit = resource.purchase_units?.[0];
        const userId = purchaseUnit?.custom_id || customId;

        console.log('✅ Webhook Verified!');
        console.log('User ID:', userId);
        console.log('Amount:', amount);
        console.log('Transaction ID:', transactionId);

        // 👉 Save to DB here if needed
      }

      res.sendStatus(200);
    } catch (err: any) {
      console.error('Webhook error:', err?.response?.data || err.message);
      res.sendStatus(500);
    }
  }
);

// ===================
// JSON Parser for Other Routes
// ===================
app.use(express.json());

// ===================
// API Routes
// ===================
app.use('/api/v1', router);

// ===================
// Create PayPal Order
// ===================
app.post('/create-order', async (req, res) => {
  const { amount, userId } = req.body;

  try {
    const accessToken = await generateAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount },
            custom_id: userId, // ✅ Attach user ID
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

    res.json({ id: response.data.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

// ===================
// Capture PayPal Order
// ===================
app.post('/capture-order/:orderID', async (req, res) => {
  const { orderID } = req.params;

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

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error capturing order');
  }
});

// ===================
// Test Route
// ===================
app.get('/test', (req, res) => {
  res.send('server running successfully');
});

// ===================
// Global Error Handler
// ===================
app.use(globalErrorHandler);

// ===================
// Root Route
// ===================
app.get('/', (req, res) => {
  res.send({ message: 'Server running successfully' });
});

export default app;









// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable no-undef */
// import express, { Application } from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import router from './app/routes';
// import globalErrorHandler from './app/middleware/globalErrorHandlear';
// import axios from 'axios';

// const app: Application = express();

// app.use(express.json());
// app.use(cookieParser());
// app.use(
//   cors({
//     origin: ['http://localhost:3000'],
//     credentials: true,
//   })
// );

// app.get('/test', async (req, res) => {
//   const a = 'server running successfully';
//   res.send(a);
// });

// app.use("/api/v1", router)

// app.use('/uploads', express.static('uploads'));

// app.use(
//   "/webhook",
//   express.raw({ type: "application/json" }) // Only for this route
// );
// app.use(express.json());


// const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // For live: use "https://api-m.paypal.com"

// const generateAccessToken = async () => {
//   const auth = Buffer.from(
//     `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
//   ).toString("base64");

//   const response = await axios.post(
//     `${PAYPAL_API}/v1/oauth2/token`,
//     "grant_type=client_credentials",
//     {
//       headers: {
//         Authorization: `Basic ${auth}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     }
//   );

//   return response.data.access_token;
// };

// // Create Order
// app.post("/create-order", async (req, res) => {
//   const { amount, userId } = req.body;

//   try {
//     const accessToken = await generateAccessToken();

//     const response = await axios.post(
//       `${PAYPAL_API}/v2/checkout/orders`,
//       {
//         intent: "CAPTURE",
//         purchase_units: [
//           {
//             amount: { currency_code: "USD", value: amount },
//             custom_id: userId,
//           }
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.json({ id: response.data.id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Something went wrong");
//   }
// });

// // Capture Order
// app.post("/capture-order/:orderID", async (req, res) => {
//   const { orderID } = req.params;

//   try {
//     const accessToken = await generateAccessToken();

//     const response = await axios.post(
//       `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.json(response.data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error capturing order");
//   }
// });

// app.post("/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     try {
//       const rawBody = req.body.toString("utf8"); // ✅ Correct way
//       const event = JSON.parse(rawBody);         // ✅ Now it's valid JSON

//       const webhookId = process.env.PAYPAL_WEBHOOK_ID;

//       const headers = req.headers;
//       const transmissionId = headers["paypal-transmission-id"];
//       const timestamp = headers["paypal-transmission-time"];
//       const webhookSig = headers["paypal-transmission-sig"];
//       const certUrl = headers["paypal-cert-url"];
//       const authAlgo = headers["paypal-auth-algo"];

//       const accessToken = await generateAccessToken();

//       const verificationResponse = await axios.post(
//         `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
//         {
//           transmission_id: transmissionId,
//           transmission_time: timestamp,
//           cert_url: certUrl,
//           auth_algo: authAlgo,
//           transmission_sig: webhookSig,
//           webhook_id: webhookId,
//           webhook_event: event,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const isValid = verificationResponse.data.verification_status === "SUCCESS";

//       if (!isValid) {
//         console.log("❌ Invalid PayPal Webhook Signature!");
//         return res.status(400).send("Invalid signature");
//       }

//       if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
//         const resource = event.resource;
//         const amount = resource.amount?.value;
//         const orderInfo = resource.purchase_units?.[0];
//         const customId = orderInfo?.custom_id;
//         const transactionId = resource.id;

//         console.log("✅ Webhook Verified!");
//         console.log("User ID:", customId);
//         console.log("Amount:", amount);
//         console.log("Transaction ID:", transactionId);
//       }

//       res.sendStatus(200);
//     } catch (err) {
//       console.error("Webhook error:", err?.response?.data || err.message);
//       res.sendStatus(500);
//     }
//   });








// app.get("/", (req, res) => {
//   res.send({ message: "server running successfully" })
// })


// app.use(globalErrorHandler);
// export default app;








// // =====================================================
// // =====================================================
// // =====================================================
// // =====================================================
// // =====================================================
// // =====================================================










// // as a admin have a stripe account , now i want to attache  banc account as a producer, i want to sell music this websit , if some one buy my music then the user need to perses the music , but the thinks is , when user but it then admin cut 3 % amout the main music coust and 97% amount gone to the producer bank account, a single transaction , no withrow request, as at fiest the producers need to accach his account the admin main stripe account , then every transaction admin cut 3% or producer get 97%,
// // ================
// // now build this function user react and node express with mongoose and typescript for backend ,


// // https://chatgpt.com/c/68610f50-6b24-800c-8d49-fbaaf4c4a924  double transaction at a time all code,
// // https://chatgpt.com/c/68610f50-6b24-800c-8d49-fbaaf4c4a924









// // app.post("/webhook", express.raw({ type: "*/*" }), async (req, res) => {
// //   const webhookId = process.env.PAYPAL_WEBHOOK_ID;

// //   const headers = req.headers;
// //   const body = req.body;

// //   const transmissionId = headers["paypal-transmission-id"];
// //   const timestamp = headers["paypal-transmission-time"];
// //   const webhookSig = headers["paypal-transmission-sig"];
// //   const certUrl = headers["paypal-cert-url"];
// //   const authAlgo = headers["paypal-auth-algo"];

// //   const rawBody = body.toString();

// //   try {
// //     const accessToken = await generateAccessToken();

// //     const verificationResponse = await axios.post(
// //       `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
// //       {
// //         transmission_id: transmissionId,
// //         transmission_time: timestamp,
// //         cert_url: certUrl,
// //         auth_algo: authAlgo,
// //         transmission_sig: webhookSig,
// //         webhook_id: webhookId, // ✅ Required here
// //         webhook_event: JSON.parse(rawBody),
// //       },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${accessToken}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );

// //     const isValid = verificationResponse.data.verification_status === "SUCCESS";

// //     if (!isValid) {
// //       console.log("❌ Invalid PayPal Webhook Signature!");
// //       return res.status(400).send("Invalid signature");
// //     }

// //     const event = JSON.parse(rawBody);

// //     if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
// //       const resource = event.resource;

// //       const amount = resource.amount?.value;
// //       const orderInfo = resource.purchase_units?.[0];
// //       const customId = orderInfo?.custom_id;
// //       const transactionId = resource.id;

// //       console.log("✅ Verified Webhook Triggered!");
// //       console.log("User ID:", customId);
// //       console.log("Amount:", amount);
// //       console.log("Transaction ID:", transactionId);

// //       return res.sendStatus(200);
// //     }

// //     res.sendStatus(200);
// //   } catch (error) {
// //     console.error("Webhook error:", error.response?.data || error.message);
// //     res.sendStatus(500);
// //   }
// // });



// // app.post("/webhook", async (req, res) => {
// //   const event = req.body;

// //   // PayPal will send various types of events
// //   if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
// //     const resource = event.resource;

// //     // Extract data
// //     const amount = resource.amount?.value;
// //     const userId = resource.supplementary_data?.related_ids?.order_id;

// //     const orderInfo = resource.purchase_units?.[0];
// //     const customId = orderInfo?.custom_id; // ✅ Our userId
// //     const transactionId = resource.id;

// //     console.log("✅ Webhook Triggered!");
// //     console.log("User ID:", customId);
// //     console.log("Amount:", amount);
// //     console.log("Transaction ID:", transactionId);

// //     // You can now store this in your DB

// //     return res.sendStatus(200);
// //   }

// //   res.sendStatus(200);
// // });



