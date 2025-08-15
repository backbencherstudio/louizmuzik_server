import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { UserServices } from './user.service';
import config from '../../config';



const createAdmin = catchAsync(async (req, res) => {
  const result = await UserServices.createAdmin();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'admin created successfully',
    data: result,
  });
});

const createUser = catchAsync(async (req, res) => {
  const result = await UserServices.createUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent to your email. Please verify to complete registration',
    data: result,
  });
});


const resetPassword = catchAsync(async (req, res) => {
  const result = await UserServices.resetPasswordIntoDB(req?.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP send Your Email, reset password withen 2 minuts',
    data: result,
  });
});

const verifyOtpForResetPassword = catchAsync(async (req, res) => {
  const getOtpData = req.body;

  const result = await UserServices.updatePasswordWithOtpVerification(getOtpData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'reset password successfully!',
    data: result,
  });

})



const loginUser = catchAsync(async (req, res) => {
  const result = await UserServices.loginUserIntoDB(req.body);
  const { refreshToken, accessToken } = result;
  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'development',
    httpOnly: true,
    sameSite: 'none',
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is loged in successfully',
    data: {
      accessToken,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await UserServices.refreshToken(refreshToken);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access is token retrived successfully',
    data: result,
  });
});

const userDelete = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await UserServices.userDeleteIntoDB(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Delete successFully',
    data: result,
  });
});

const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await UserServices.verifyOTPintoDB(email, otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Registered successFully',
    data: result,
  });
});

const googleLogin = catchAsync(async (req, res) => {
  const result = await UserServices.googleLogin(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Registered successFully',
    data: result,
  });
});




export const userController = {
  createAdmin,
  createUser,
  loginUser,
  userDelete,
  verifyOTP,
  refreshToken,
  resetPassword,
  verifyOtpForResetPassword,
  googleLogin
};
