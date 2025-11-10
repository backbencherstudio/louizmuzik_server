import express from 'express';
import { melodyController } from './melody.controller';

const router = express.Router();


router.get(
  '/',
  melodyController.getAllMelodyes
);
router.post("/create-melody", melodyController.melodyCreateByProducer);
router.patch("/update-melody/:melodyId", melodyController.melodyUpdateByProducer);
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
router.patch(
  '/eachMelodyDownloadCounter/:melodyId',
  melodyController.eachMelodyDownloadCounter
);
router.get(
  '/melodyDownloadCounterForEachProducer/:producerId',
  melodyController.melodyDownloadCounterForEachProducer
);
router.patch(
  '/melodyPlay/:melodyId',
  melodyController.melodyPlay
);

router.get(
  '/license/:melodyId',
  melodyController.melodyLicensePdfGenerate
);


router.get(
  '/single-melody/:melodyId',
  melodyController.getSingleMelodyData
);


export const MelodyRouter = router;