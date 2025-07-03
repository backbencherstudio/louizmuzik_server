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

const followingProducersCalculation = catchAsync(async (req, res) => {
  const currentUserId = req.params.currentUserId
  const producerUserId = req.query.producerUserId

  const result = await UserManagement.followingProducersCalculation(currentUserId, producerUserId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'You are now following this producer.',
    data: result,
  });
});

const allProducersDataWithTopProducersData = catchAsync(async (req, res) => {
  const result = await UserManagement.allProducersDataWithTopProducersData();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get all producers with top 5 producers.',
    data: result,
  });
});

const followingUsersAllMelodyAndPack = catchAsync(async (req, res) => {
  const result = await UserManagement.followingUsersAllMelodyAndPack(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get following producers all melody and packs.',
    data: result,
  });
});


const singleUserInfoAndThisUserAllMelodyAndPacksForProfile = catchAsync(async (req, res) => {
  const result = await UserManagement.singleUserInfoAndThisUserAllMelodyAndPacksForProfile(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get all melody and packs and usr data for profile view.',
    data: result,
  });
});

const favoritesMelodyAndFavouritePackForEachUser = catchAsync(async (req, res) => {
  const result = await UserManagement.favoritesMelodyAndFavouritePackForEachUser(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get all favorite pack and melody for each user, for favorites page.',
    data: result,
  });
});



export const UserManagementController = {
  updateUserData,
  changePassword,
  followingProducersCalculation,
  allProducersDataWithTopProducersData,
  followingUsersAllMelodyAndPack,
  singleUserInfoAndThisUserAllMelodyAndPacksForProfile,
  favoritesMelodyAndFavouritePackForEachUser
}
