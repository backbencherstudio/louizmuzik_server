import express from 'express'
import { packController } from './pack.controller'

const router = express.Router();

router.post('/create-pack', packController.createPackIntoDB)



export const pactRoute = router