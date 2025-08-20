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

const billingHistoryForAdmin = catchAsync(async (req, res) => {
  const result = await adminService.billingHistoryForAdmin();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get all billing History successfully',
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

const adminOverview = catchAsync(async (req, res) => {
  const result = await adminService.adminOverview(); 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "admin overview data for dashboard" ,
    data: result,
  });
});

const singleUserInformationForAdmin = catchAsync(async (req, res) => {
  const result = await adminService.singleUserInformationForAdmin(req.params.userId); 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "get single User Information For Admin" ,
    data: result,
  });
});

export const adminUserController = {
    getAllUsrDataByAdminFromDB,
    changeUsersSubscriptionStatus,
    billingHistoryForAdmin,
    deleteUser,
    adminOverview,
    singleUserInformationForAdmin
}