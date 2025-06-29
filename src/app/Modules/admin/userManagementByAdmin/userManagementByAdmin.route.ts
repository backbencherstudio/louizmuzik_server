import express from 'express';
import { adminUserController } from './userManagementByAdmin.controller';

const router = express.Router();


router.get(
  '/',
  adminUserController.getAllUsrDataByAdminFromDB,
);

router.patch(
  '/:selectedUser_Id',
  adminUserController.changeUsersSubscriptionStatus,
);





export const UserManagementRouterForAdmin = router;