import httpStatus from "http-status";
import { catchAsync } from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { adminService } from "./userManagementByAdmin.service";

const getAllUsrDataByAdminFromDB = catchAsync(async (req, res) => {
  const result = await adminService.getALlUserByAdmin();  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get all user data by admin',
    data: result,
  });
});

export const adminUserController = {
    getAllUsrDataByAdminFromDB
}