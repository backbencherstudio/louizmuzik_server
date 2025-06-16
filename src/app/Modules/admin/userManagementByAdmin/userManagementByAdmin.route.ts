import express from 'express';
import { adminUserController } from './userManagementByAdmin.controller';

const router = express.Router();


router.get(
  '/',
  adminUserController.getAllUsrDataByAdminFromDB,
);



export const UserManagementRouterForAdmin = router;