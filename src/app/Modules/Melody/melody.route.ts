import express from 'express';
import { melodyController } from './melody.controller';

const router = express.Router();


router.post(
  '/create-melody',
  melodyController.melodyCreateByProducer
);



export const MelodyRouter = router;