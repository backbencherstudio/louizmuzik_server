// =======================================
// ✅ Step 3: payment.route.ts
// =======================================

import express from 'express';
import { paymentController } from './payment.controller';

const router = express.Router();

router.post("/create-order", paymentController.createOrderWithPaypal);
router.post("/capture-order/:orderID", paymentController.captureOrder);
router.post("/webhook", paymentController.webhookEvent);


export const paymentRouter = router;
