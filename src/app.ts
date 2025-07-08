import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';

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

app.get('/', (req, res) => res.send({ message: 'Server running successfully' }));

app.use(globalErrorHandler);

export default app;
