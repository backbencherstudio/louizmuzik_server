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

router.delete(
  '/:selectedUser_Id',
  adminUserController.deleteUser,
);

router.get(
  '/billingHistoryForAdmin',
  adminUserController.billingHistoryForAdmin,
);





export const UserManagementRouterForAdmin = router;