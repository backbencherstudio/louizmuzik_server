/* eslint-disable no-undef */
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserManagement } from "./user.management.service";

const updateUserData = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const profile_image = files?.map((file) => `/uploads/${file.filename}`)[0];
  const updatedData = {
    profile_image,
    ...req.body
  }
  const result = await UserManagement.updateUserDataIntoDB(req.params.userId, updatedData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user update successfully',
    data: result,
  });
});


const changePassword = catchAsync(async (req, res) => {
  const result = await UserManagement.changePasswordIntoDB(req.params.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'password changed successfully',
    data: result,
  });
});



export const UserManagementController = {
  updateUserData,
  changePassword
}
