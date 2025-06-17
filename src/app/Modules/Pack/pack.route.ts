import express from 'express'
import { packController } from './pack.controller'

const router = express.Router();

router.get('/', packController.getAllPackFromDB)

router.get('/:userId', packController.getSingleUserAllPackFromDB)

router.post('/create-pack', packController.createPackIntoDB)

router.patch(   //============== add favourite and remove facourite pack
  '/:packId',
  packController.selectFavoritePack
);


router.delete('/:packId', packController.deleteSinglePackByUser)


export const pactRoute = router