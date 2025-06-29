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

const changeUsersSubscriptionStatus = catchAsync(async (req, res) => {
  const result = await adminService.changeUsersSubscriptionStatus(req.params.selectedUser_Id); // selected user _id
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'change the subscription status successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await adminService.deleteUser(req.params.selectedUser_Id); // selected user _id
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result ,
    data: true,
  });
});

export const adminUserController = {
    getAllUsrDataByAdminFromDB,
    changeUsersSubscriptionStatus,
    deleteUser
}