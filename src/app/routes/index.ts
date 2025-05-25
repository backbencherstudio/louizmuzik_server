import express from 'express';
import { UserRouter } from '../Modules/User/user.route';
const router = express.Router();

const moduleRoutes = [
  { path: '/auth', route: UserRouter },
];

moduleRoutes.forEach((pathRouter) =>
  router.use(pathRouter.path, pathRouter.route),
);

export default router;
