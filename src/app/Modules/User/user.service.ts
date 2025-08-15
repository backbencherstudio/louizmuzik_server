/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { AppError } from "../../errors/AppErrors";
import bcrypt from 'bcrypt';
import config from "../../config";
import { TampUserCollection, User } from "./user.model";
import { TLoginUser, TUser } from "./user.interface";
import { sendEmail } from "../../utils/sendEmail";
import { createToken, verifyToken } from "./user.utils";


const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("123456", 8);
  const adminData = {
    name: "admin name",
    email: "admin@gmail.com",
    password: hashedPassword,
    country: "USA",
    role: "admin"
  }
  const result = await User.create(adminData)
  return result
}

const createUserIntoDB = async (payload: TUser) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expirationTime = new Date(Date.now() + 2 * 60 * 1000);

  const isStudentExists = await TampUserCollection.findOne({ email: payload?.email });
  const isStudentExistsInUser = await User.findOne({ email: payload?.email });

  const hashedPassword = await bcrypt.hash(payload?.password, 8);

  if (isStudentExistsInUser) {
    throw new AppError(400, 'User already exists');
  }

  if (isStudentExists) {
    const data = {
      email: payload?.email,
      password: hashedPassword,
      producer_name: payload?.producer_name,
      country: payload?.country,
      otp,
      expiresAt: expirationTime,
    }

    await TampUserCollection.findOneAndUpdate({ email: payload?.email }, data, { new: true, runValidators: true })
    await sendEmail(payload?.email, otp);
    return
  }

  const newUserData = {
    email: payload?.email,
    password: hashedPassword,
    producer_name: payload?.producer_name,
    country: payload?.country,
    otp,
    expiresAt: expirationTime,
  };

  await sendEmail(payload?.email, otp);
  await TampUserCollection.create(newUserData);

  return {
    success: true,
    message: 'OTP sent to your email. Please verify to complete registration.',

  };
};

const resetPasswordIntoDB = async (payload: any) => {
  const isUserExistsInUser = await User.findOne({ email: payload?.email });
  if (!isUserExistsInUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const result = {
    producer_name: "dummy name",
    otp,
    email: payload.email,
    password: payload.password
  };

  const createOrUpdateOtp = await TampUserCollection.findOneAndUpdate(
    { email: payload.email },
    result,
    { upsert: true, new: true }
  );

  await sendEmail(payload?.email, otp);
  return createOrUpdateOtp;
};

const updatePasswordWithOtpVerification = async (getOtpData: any) => {
  const existsData = await TampUserCollection.findOne({ email: getOtpData?.email });
  if (!existsData) {
    return new AppError(httpStatus.NOT_FOUND, "Data not found")
  }
  if (parseInt(getOtpData?.otp) !== parseInt(existsData.otp)) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, "OTP not match")
  }
  const hashedPassword = await bcrypt.hash(existsData?.password, 8);
  const result = await User.findOneAndUpdate({ email: getOtpData.email }, { password: hashedPassword }, { new: true, runValidators: true })

  if (result) {
    await TampUserCollection.findOneAndDelete({ email: existsData?.email })
  }

  return result
}

const userDeleteIntoDB = async (payload: any) => {
  const isUserExists = await User.findOne({ email: payload });
  if (!isUserExists) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not Found")
  }
  const result = await User.findOneAndUpdate({ email: payload }, { isDeleted: true }, { new: true, runValidators: true })
  return result
}

const verifyOTPintoDB = async (email: string, otp: string) => {
  const tempUser = await TampUserCollection.findOne({ email });

  if (!tempUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found. Try again');
  }

  if (tempUser.otp !== otp) {
    throw new AppError(400, 'OTP not matched, try again');
  }

  if (new Date() > tempUser.expiresAt) {
    throw new AppError(400, 'OTP has expired, please request a new one');
  }

  const newUserData = {
    email: tempUser.email,
    password: tempUser.password,
    producer_name: tempUser.producer_name,
    country: tempUser.country
  };

  await User.create(newUserData);
  await TampUserCollection.deleteOne({ email });

  return {
    success: true,
    message: 'User registered successfully!',
  };
};

const loginUserIntoDB = async (paylod: TLoginUser) => {
  const userData = await User.findOne({ email: paylod.email });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User is not found');
  }
  const res = await bcrypt.compare(paylod.password, userData.password)
  if (!res) {
    throw new AppError(httpStatus.FORBIDDEN, 'password is not matched');
  }

  const jwtPayload = {
    email: userData.email,
    producer_name: userData.producer_name,
    userId: userData._id
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );
  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorize!');
  }
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);
  const { email } = decoded;

  const userData = await User.findOne({ email });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User is not found');
  }

  const jwtPayload = {
    producer_name: userData.producer_name,
    email: userData.email,
    userId: userData?._id
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    accessToken,
  };
};


const googleLogin = async (payload: any) => {
  const isUserExists = await User.findOne({ email: payload.email })

  if (isUserExists) {
    const jwtPayload = {
      email: isUserExists.email,
      producer_name: isUserExists.producer_name,
      userId: isUserExists._id
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string,
    );
    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string,
    );
    return {
      accessToken,
      refreshToken,
    };
  }


  const newUserData = {
    email: payload.email,
    producer_name: payload.producer_name,
    password: "",
    country: "Need to update"
  };
  const result = await User.create(newUserData)

  if (result) {
    const jwtPayload = {
      email: result.email,
      producer_name: result.producer_name,
      userId: result._id
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string,
    );
    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string,
    );
    return {
      accessToken,
      refreshToken,
    };
  }


}




export const UserServices = {
  createAdmin,
  createUserIntoDB,
  userDeleteIntoDB,
  verifyOTPintoDB,
  loginUserIntoDB,
  resetPasswordIntoDB,
  updatePasswordWithOtpVerification,
  refreshToken,
  googleLogin
};