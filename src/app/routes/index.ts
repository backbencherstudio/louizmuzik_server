import express from 'express';
import { UserRouter } from '../Modules/User/user.route';
import { UserManagementRouter } from '../Modules/userManagement.ts/user.management.route';
import { UserManagementRouterForAdmin } from '../Modules/admin/userManagementByAdmin/userManagementByAdmin.route';
import { MelodyRouter } from '../Modules/Melody/melody.route';
import { pactRoute } from '../Modules/Pack/pack.route';
import { paymentRouter } from '../Modules/Payment/payment.route';
const router = express.Router();

const moduleRoutes = [
  { path: '/auth', route: UserRouter },
  { path: '/admin', route: UserManagementRouterForAdmin },
  { path: '/melody', route: MelodyRouter },
  { path: '/pack', route: pactRoute },
  { path: '/auth/userManagement', route: UserManagementRouter },
  { path: '/payment', route: paymentRouter },
];

moduleRoutes.forEach((pathRouter) =>
  router.use(pathRouter.path, pathRouter.route),
);

export default router;
