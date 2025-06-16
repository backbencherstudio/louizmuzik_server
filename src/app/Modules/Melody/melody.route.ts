import express from 'express';
import { melodyController } from './melody.controller';

const router = express.Router();


router.post(
  '/create-melody',
  melodyController.melodyCreateByProducer
);

router.get(
  '/:userId',
  melodyController.getAllMelodesEachProducer
);

router.delete(
  '/:melodyId',
  melodyController.deleteMelodesEachProducer
);

router.patch(
  '/:melodyId',
  melodyController.selectFavoriteMelody
);



export const MelodyRouter = router;