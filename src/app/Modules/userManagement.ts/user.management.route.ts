import express from 'express';
import { UserManagementController } from './user.management.controller';
import { upload } from '../../middleware/uploads';

const router = express.Router();


router.patch(
  '/:userId',
   upload.array('profile_image', 1),
  UserManagementController.updateUserData,
);

router.patch(
  '/changePassword/:userId',
  UserManagementController.changePassword,
);

router.patch(
  '/followingProducersCalculation/:currentUserId',
  UserManagementController.followingProducersCalculation,
);






export const UserManagementRouter = router;
