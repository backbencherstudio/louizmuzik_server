// =======================================
// ✅ Step 3: payment.route.ts
// =======================================

import express from 'express';
import { paymentController } from './payment.controller';
import { stripeSubscriptionService } from './stripe.payment.service';

const router = express.Router();

// ============== Paypal
router.post("/paypalSubscription", paymentController.paypalSubscription);
router.post("/create-order", paymentController.createOrderWithPaypal);
router.post("/capture-order/:orderID", paymentController.captureOrder);
router.post("/webhook", paymentController.webhookEvent);
// ============== Paypal

router.post("/stripeSubscription", stripeSubscriptionService.stripeSubscription)


export const paymentRouter = router;
