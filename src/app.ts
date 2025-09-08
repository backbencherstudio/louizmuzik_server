import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';
import bodyParser from "body-parser";

dotenv.config();
const app: Application = express();

// ✅ Apply CORS before everything
// app.use(cors({
//   origin: [
//     'http://localhost:3000',
//     'https://louizmuzik-client.vercel.app',
//     'https://louiz.s3.us-east-2.amazonaws.com',
//   ],
//   credentials: true, // Allow credentials (cookies)
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Add 'PATCH' method
//   allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
// }));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from the specified domains
    const allowedOrigins = [
      'https://louizmuzik-client.vercel.app',
      'http://localhost:3000', // For local development
    ];

    if ((typeof origin === 'string' && allowedOrigins.includes(origin)) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed by this origin'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Ensure PATCH is allowed
  allowedHeaders: ['Content-Type', 'Authorization'], // Ensure the headers are allowed
}));



app.use(cookieParser());

// ✅ Stripe webhook (raw body) must be before express.json()
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));
app.use("/api/v1/payment/stripeWebhook", bodyParser.raw({ type: "application/json" }));

// ✅ Apply JSON after raw body routes
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/v1', router);

app.get('/', (req, res) => res.send({ message: 'Server running successfully !!' }));

// Global error handler
app.use(globalErrorHandler);

export default app;



// [
//     {
//         "AllowedHeaders": [
//             "*"
//         ],
//         "AllowedMethods": [
//             "GET",
//             "PUT",
//             "POST",
//             "DELETE",
//             "HEAD"
//         ],
//         "AllowedOrigins": [
//             "*"
//         ],
//         "ExposeHeaders": [
//             "ETag",
//             "x-amz-request-id",
//             "x-amz-id-2"
//         ],
//         "MaxAgeSeconds": 3000
//     }
// ]











// /* eslint-disable @typescript-eslint/no-explicit-any */
// import express, { Application } from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import dotenv from 'dotenv';
// import router from './app/routes';
// import globalErrorHandler from './app/middleware/globalErrorHandlear';
// import bodyParser from "body-parser";

// dotenv.config();
// const app: Application = express();

// // ✅ Apply CORS before everything
// app.use(cors({
//   origin: [
//     'http://localhost:3000',
//     'https://louizmuzik-client.vercel.app',
//     'https://louiz.s3.us-east-2.amazonaws.com'
//   ],
//   credentials: true,
// }));

// app.use(cookieParser());

// // ✅ Stripe webhook (raw body) must be before express.json()
// app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));
// app.use("/api/v1/payment/stripeWebhook", bodyParser.raw({ type: "application/json" }));

// // ✅ Apply JSON after raw body routes
// app.use(express.json());

// // Serve static uploads
// app.use('/uploads', express.static('uploads'));

// // API routes
// app.use('/api/v1', router);

// app.get('/', (req, res) => res.send({ message: 'Server running successfully !!' }));

// // Global error handler
// app.use(globalErrorHandler);

// export default app;

















// /* eslint-disable @typescript-eslint/no-explicit-any */
// import express, { Application } from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import dotenv from 'dotenv';
// import router from './app/routes';
// import globalErrorHandler from './app/middleware/globalErrorHandlear';
// import bodyParser from "body-parser";

// dotenv.config();
// const app: Application = express();

// app.use(cookieParser());

// app.use(cors({
//   origin: ['http://localhost:3000', 'https://louizmuzik-client.vercel.app', 'https://louiz.s3.us-east-2.amazonaws.com'],
//   credentials: true,
// }));

// // Raw parser BEFORE express.json (Paypal)
// app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

// // Raw parser BEFORE express.json (stripe)
// app.use((req, res, next) => {
//   // if (req.originalUrl === '/api/v1/payment/stripeWebhook') {
//   if (req.originalUrl === '/api/v1/payment/stripeWebhook') {
//     next();
//   } else {
//     express.json()(req, res, next);
//   }
// });

// app.use("/api/v1/payment/stripeWebhook", bodyParser.raw({ type: "application/json" }));

// app.use('/uploads', express.static('uploads'));
// app.use(express.json());

// app.use('/api/v1', router);


// app.get('/', (req, res) => res.send({ message: 'Server running successfully' }));

// app.use(globalErrorHandler);

// export default app;


















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
