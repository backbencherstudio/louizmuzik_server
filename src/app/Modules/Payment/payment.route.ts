import express from 'express'
import { paymentController } from './payment.controller';

const router = express.Router();

router.get("/link-paypal", paymentController.clientPaypaLinkToAdminAccountService);

router.get("/paypal-callback", paymentController.paypalCallBack);


export const paymentRouter = router