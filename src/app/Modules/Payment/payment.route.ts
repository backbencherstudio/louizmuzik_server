// =======================================
// ✅ Step 3: payment.route.ts
// =======================================

import express from 'express';
import { paymentController } from './payment.controller';
import { stripeSubscriptionService } from './stripe.payment.service';
import bodyParser from "body-parser";

const router = express.Router();

// ============== Paypal
router.post("/paypalSubscription", paymentController.paypalSubscription);
router.post("/paypalSubscriptionCancel/:subscriptionId", paymentController.paypalSubscriptionCancel);
router.post("/create-order", paymentController.createOrderWithPaypal);
router.post("/capture-order/:orderID", paymentController.captureOrder);
router.post("/webhook", paymentController.webhookEvent);
// ============== Paypal


// ============== stripe
router.post("/stripeSubscription", stripeSubscriptionService.stripeSubscription)
router.post("/stripeWebhook", bodyParser.raw({ type: "application/json" }), stripeSubscriptionService.stripeWebhook);
router.post("/cancel-subscription/:customerId", stripeSubscriptionService.cancelSubscription);
// ============== stripe


export const paymentRouter = router;
