import express from 'express'
import { packController } from './pack.controller'

const router = express.Router();

router.get('/', packController.getAllPackFromDB)

router.get('/:userId', packController.getSingleUserAllPackFromDB)

router.post('/create-pack', packController.createPackIntoDB)

router.patch('/update-pack/:packId', packController.updatePackIntoDB)

router.patch(   //============== add favourite and remove facourite pack
  '/:packId',
  packController.selectFavoritePack
);

router.get(   //============== //=== this api for single pack page
  '/single-pack/:packId',
  packController.getSinglePackAndAllPackEachUser
);


router.post('/packPurchase', packController.packPurchaseDataStoreIntoDB)

router.delete('/:packId', packController.deleteSinglePackByUser)


export const pactRoute = router