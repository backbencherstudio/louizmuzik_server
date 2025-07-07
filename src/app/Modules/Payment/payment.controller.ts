import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaypalService } from "./payment.service";

const clientPaypaLinkToAdminAccountService = catchAsync(async (req, res) => {
    const result = await PaypalService.clientPaypaLinkToAdminAccountService();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'client Paypal Link To Admin Account Service',
        data: result,
    });
});

const paypalCallBack = catchAsync(async (req, res) => {
    const { code, userId } = req.query; // Extract code and userId from query parameters

    if (!code || !userId) {
        return res.status(400).send("Missing code or userId");
    }
    const result = await PaypalService.paypalCallBack(code as string, userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'paypalCallBack',
        data: result,
    });
});


export const paymentController = {
    clientPaypaLinkToAdminAccountService,
    paypalCallBack
}