import express from 'express';
import { melodyController } from './melody.controller';
// import upload from '../../middleware/uploads';

const router = express.Router();


router.get(
  '/',
  melodyController.getAllMelodyes
);

// router.post(
//   '/create-melody',
//   upload.single("image"),
//   melodyController.melodyCreateByProducer
// );

router.post("/create-melody", melodyController.melodyCreateByProducer);

router.patch("/update-melody/:melodyId", melodyController.melodyUpdateByProducer);

// router.post("/create-melody", melodyController.melodyCreateByProducer);


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

router.get(
  '/melodyDownloadCounterForEachProducer/:producerId',
  melodyController.melodyDownloadCounterForEachProducer
);

router.patch(
  '/melodyPlay/:melodyId',
  melodyController.melodyPlay
);

router.get(
  '/single-melody/:melodyId',
  melodyController.getSingleMelodyData
);



export const MelodyRouter = router;