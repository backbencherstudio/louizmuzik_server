import express from 'express';
import { melodyController } from './melody.controller';

const router = express.Router();


router.get(
  '/',
  melodyController.getAllMelodyes
);

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

router.patch(   //============== add favourite and remove facourite melody
  '/:melodyId',
  melodyController.selectFavoriteMelody
);

router.patch(
  '/eachMelodyDownloadCounter/:melodyId',
  melodyController.eachMelodyDownloadCounter
);

router.patch(
  '/melodyPlay/:melodyId',
  melodyController.melodyPlay
);



export const MelodyRouter = router;