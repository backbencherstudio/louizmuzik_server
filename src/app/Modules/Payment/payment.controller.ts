import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const paypalSubscription = catchAsync(async (req, res) => {
  const { amount, paypalEmail } = req.body;
  const result = await paymentService.paypalSubscription(parseInt(amount), paypalEmail);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'subscription created (paypal)',
    data: result,
  });
});

const createOrderWithPaypal = catchAsync(async (req, res) => {
  const { amount, selectedData } = req.body;
  const result = await paymentService.createOrderWithPaypal(amount, selectedData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order created',
    data: result,
  });
});

const captureOrder = catchAsync(async (req, res) => {
  const { orderID } = req.params;
  const result = await paymentService.captureOrder(orderID);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order captured',
    data: result,
  });
});

const webhookEvent = catchAsync(async (req, res) => {
  const event = JSON.parse(req.body.toString('utf8'));
  const result = await paymentService.webhookEvent(event, req.headers);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Webhook handled',
    data: result,
  });
});

export const paymentController = {
  paypalSubscription,
  createOrderWithPaypal,
  captureOrder,
  webhookEvent,
}
