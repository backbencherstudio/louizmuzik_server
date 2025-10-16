import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';
import bodyParser from "body-parser";

dotenv.config();
const app: Application = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://louizmuzik-client.vercel.app',
      'http://localhost:3000',
    ];

    if ((typeof origin === 'string' && allowedOrigins.includes(origin)) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed by this origin'));
    }
  },
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
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
