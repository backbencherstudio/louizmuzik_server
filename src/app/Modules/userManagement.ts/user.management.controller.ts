/* eslint-disable no-undef */
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserManagement } from "./user.management.service";
import { User } from "../User/user.model";
import AWS from "aws-sdk";
import { AppError } from "../../errors/AppErrors";

const bucketName = process.env.BUCKET_NAME!;

const s3 = new AWS.S3({
  region: process.env.REGION!,
  accessKeyId: process.env.ACCESS_KEY!,
  secretAccessKey: process.env.ACCESS_SECRET_key!,
  httpOptions: {
    timeout: 60 * 60 * 1000,
  },
  maxRetries: 3,
});



const getSingleUserData = catchAsync(async (req, res) => {
  const result = await UserManagement.getSingleUserData(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user data get successfully',
    data: result,
  });
});

const updateUserData = catchAsync(async (req, res) => {
  const file = req.file;
  const userId = req.params.userId;

  let newProfileImageUrl: string | null = null;

  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  // if (file) {
  //   const cleanFilename = file.originalname
  //     .replace(/\s+/g, "_")
  //     .replace(/[^a-zA-Z0-9._-]/g, "")
  //     .toLowerCase();

  //   const s3Key = `${Date.now()}-${cleanFilename}`;

  //   try {
  //     if (user.profile_image) {
  //       console.log(53, user.profile_image);

  //       const oldImageKey = new URL(user.profile_image).pathname.substring(1);
  //       await s3.deleteObject({
  //         Bucket: bucketName,
  //         Key: oldImageKey,
  //       }).promise();
  //     }
  //     const uploadResult = await s3.upload({
  //       Bucket: bucketName, 
  //       Key: s3Key,
  //       Body: file.buffer,
  //       ContentType: file.mimetype,
  //     }).promise();

  //     newProfileImageUrl = uploadResult.Location;
  //   } catch (err) {
  //     console.error("S3 upload/delete error:", err);
  //     throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "S3 error");
  //   }
  // } 

  if (file) {
    const cleanFilename = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

    const s3Key = `${Date.now()}-${cleanFilename}`;

    try {
      const uploadResult = await s3.upload({
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }).promise();

      newProfileImageUrl = uploadResult.Location;
    } catch (err) {
      console.error("S3 upload error:", err);
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "S3 upload error");
    }
  }

  else {
    newProfileImageUrl = user.profile_image;
  }
  const updatedData = {
    ...req.body,
    profile_image: newProfileImageUrl,
  };

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Your data updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Database update error:", err);
    res.status(500).send({ message: "Failed to update user" });
  }
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


const addPaypalEmail = catchAsync(async (req, res) => {
  const result = await UserManagement.addPaypalEmail(req.body.paypalEmail, req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'email added successfully',
    data: result,
  });
});

const singleUserBillingHistory = catchAsync(async (req, res) => {
  const result = await UserManagement.singleUserBillingHistory(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'single user Billing History get successfully',
    data: result,
  });
});

const singleUserSaleseHistory = catchAsync(async (req, res) => {
  const result = await UserManagement.singleUserSaleseHistory(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'single user sales History get successfully',
    data: result,
  });
});

const directSubscription = catchAsync(async (req, res) => {
  const result = await UserManagement.directSubscription(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Direct Subscription',
    data: result,
  });
});



export const UserManagementController = {
  getSingleUserData,
  updateUserData,
  changePassword,
  followingProducersCalculation,
  allProducersDataWithTopProducersData,
  followingUsersAllMelodyAndPack,
  singleUserInfoAndThisUserAllMelodyAndPacksForProfile,
  favoritesMelodyAndFavouritePackForEachUser,
  addPaypalEmail,
  singleUserBillingHistory,
  singleUserSaleseHistory,
  directSubscription
}
