/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';
import bodyParser from "body-parser";

dotenv.config();
const app: Application = express();

app.use(cookieParser());

// app.use(cors({
//   origin: ['http://localhost:3000', 'https://louizmuzik-client.vercel.app', 'https://louiz.s3.us-east-2.amazonaws.com'],
//   credentials: true,
// }));

// app.use(
//   cors({
//     origin: ['*'],
//     // origin: [
//     //   'http://localhost:3000',
//     //   'https://louizmuzik-client.vercel.app',
//     // ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

const allowedOrigins = [
  'http://localhost:3000',
  'https://louizmuzik-client.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);



// Raw parser BEFORE express.json (Paypal)
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

// Raw parser BEFORE express.json (stripe)
app.use((req, res, next) => {
  // if (req.originalUrl === '/api/v1/payment/stripeWebhook') {
  if (req.originalUrl === '/api/v1/payment/stripeWebhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use("/api/v1/payment/stripeWebhook", bodyParser.raw({ type: "application/json" }));

app.use('/uploads', express.static('uploads'));
app.use(express.json());

app.use('/api/v1', router);


app.get('/', (req, res) => res.send({ message: 'Server running successfully!!!' }));

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
