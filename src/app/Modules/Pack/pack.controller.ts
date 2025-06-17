import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { packService } from "./pack.service";

const createPackIntoDB = catchAsync(async (req, res) => {
    const result = await packService.createPackIntoDB(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Pack created successfully',
        data: result,
    });
});


export const packController = {
    createPackIntoDB
}