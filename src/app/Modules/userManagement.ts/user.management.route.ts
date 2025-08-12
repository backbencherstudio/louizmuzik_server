import express from 'express';
import { UserManagementController } from './user.management.controller';
import { upload } from './upload';
// import { upload } from '../../middleware/uploads';

const router = express.Router();

router.get(
  '/getSingleUserData/:userId',
  UserManagementController.getSingleUserData,
);

router.get(
  '/allProducersDataWithTopProducersData',
  UserManagementController.allProducersDataWithTopProducersData,
);

router.patch(
  '/:userId',
  upload,
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
  '/profile/:userId',  // current user id  (for profile) == this api both of profile and your items page
  UserManagementController.singleUserInfoAndThisUserAllMelodyAndPacksForProfile,
);

router.get(
  '/favorites/:userId',  // for favorite page ( current user id )
  UserManagementController.favoritesMelodyAndFavouritePackForEachUser,
);

router.patch(
  '/addPaypalEmail/:userId',  //  producer paypal email ( current user id )
  UserManagementController.addPaypalEmail,
);

router.get(
  '/billingHistory/:userId',  //  producer paypal email ( current user id )
  UserManagementController.singleUserBillingHistory,
);







export const UserManagementRouter = router;
