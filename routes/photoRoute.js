const express=require('express')
const photoController=require("./../controller/photoController");
const router = express.Router();
const authController=require('./../controller/authController')

router.post('/upload',photoController.uploadPhoto)

module.exports=router;