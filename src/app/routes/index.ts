import express from 'express';
import { UserRouter } from '../Modules/User/user.route';
import { UserManagementRouter } from '../Modules/userManagement.ts/user.management.route';
const router = express.Router();

const moduleRoutes = [
  { path: '/auth', route: UserRouter },
  { path: '/auth/userManagement', route: UserManagementRouter },
];

moduleRoutes.forEach((pathRouter) =>
  router.use(pathRouter.path, pathRouter.route),
);

export default router;
