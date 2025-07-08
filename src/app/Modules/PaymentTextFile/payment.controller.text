import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const createOrderWithPaypal = catchAsync(async (req, res) => {
  const { amount, userId } = req.body;
  const result = await paymentService.createOrderWithPaypal(amount, userId);
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


// export const paymentController = {
//   createOrderWithPaypal,
//   captureOrder,
//   webhookEvent,
// };


// const clientPaypaLinkToAdminAccountService = catchAsync(async (req, res) => {
//     const result = await PaypalService.clientPaypaLinkToAdminAccountService();
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'client Paypal Link To Admin Account Service',
//         data: result,
//     });
// });

// const paypalCallBack = catchAsync(async (req, res) => {
//     const { code, userId } = req.query; // Extract code and userId from query parameters

//     if (!code || !userId) {
//         return res.status(400).send("Missing code or userId");
//     }
//     const result = await PaypalService.paypalCallBack(code as string, userId as string);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'paypalCallBack',
//         data: result,
//     });
// });


export const paymentController = {
    createOrderWithPaypal,
    captureOrder,
    webhookEvent,


    // =================================
    // ================================= >>>>  
    // =================================
    // clientPaypaLinkToAdminAccountService,
    // paypalCallBack
}