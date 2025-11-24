import express from 'express';
import { adminUserController } from './userManagementByAdmin.controller';

const router = express.Router();


router.get(
  '/',
  adminUserController.getAllUsrDataByAdminFromDB,
);

router.get(
  '/getContactUs',
  adminUserController.getAllUserContacts
)

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

router.get(
  '/adminOverview',
  adminUserController.adminOverview,
);

router.get(
  '/singleUserInformationForAdmin/:userId',
  adminUserController.singleUserInformationForAdmin,
);





export const UserManagementRouterForAdmin = router;