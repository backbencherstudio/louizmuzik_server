import express from 'express';
import { UserManagementController } from './user.management.controller';
import { upload } from '../../middleware/uploads';

const router = express.Router();

router.get(
  '/allProducersDataWithTopProducersData',
  UserManagementController.allProducersDataWithTopProducersData,
);

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

router.get(
  '/:userId',  // current user id  (for Feed page)
  UserManagementController.followingUsersAllMelodyAndPack,
);

router.get(
  '/profile/:userId',  // current user id  (for profile)
  UserManagementController.singleUserInfoAndThisUserAllMelodyAndPacksForProfile,
);







export const UserManagementRouter = router;
