import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { melodyService } from "./melody.service";

const melodyCreateByProducer = catchAsync(async (req, res) => {
  const result = await melodyService.melodyCreateByProducer(req.body);  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'melody created successfully',
    data: result,
  });
});



export const melodyController = {
    melodyCreateByProducer
}