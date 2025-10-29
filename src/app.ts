import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';
import bodyParser from "body-parser";

dotenv.config();
const app: Application = express();

const allowedOrigins = [
  '*',
  'https://louizmuzik-client.vercel.app',
  'http://localhost:3000',
  'https://melodycollab.com',
  'http://melodycollab.com',
  'https://www.melodycollab.com',
  'http://www.melodycollab.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(cookieParser());
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));
app.use("/api/v1/payment/stripeWebhook", bodyParser.raw({ type: "application/json" }));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/api/v1', router);

app.get('/', (req, res) => res.send({ message: 'Server running successfully !!' }));
app.use(globalErrorHandler);
export default app;
