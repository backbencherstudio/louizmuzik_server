import express from 'express';
import { userController } from './user.controller';

const router = express.Router();


router.post(
  '/create-admin',
  userController.createAdmin,
);

router.post(
  '/create-user',
  userController.createUser,
);

router.post(
  '/resetPassword',
  userController.resetPassword,
);

router.patch(
  '/sendOtpForResetPassword',
  userController.verifyOtpForResetPassword,
);

router.post(
  '/login',
  userController.loginUser,
);

router.patch(
  '/userDelete',
  userController.userDelete,
);

router.post(
  '/verifyOTP',
  userController.verifyOTP,
);

router.post(
  '/refresh-token',
  userController.refreshToken,
);

router.post(
  '/googleLogin',
  userController.googleLogin,
);





export const UserRouter = router;
