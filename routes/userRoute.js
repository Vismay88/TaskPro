const express=require('express')
const userController=require('./../controller/userController');
const userSchema=require('./../validatation/userValidations');
const updateUserValidation=require("./../validatation/userUpdateValidation");
const router = express.Router();
const photoController=require("./../controller/photoController")
const authController=require('./../controller/authController');
const AppError=require('./../Error/appError')
// const { userChecking } = require('./../validatation/userValidations');
const ensureLoggedIn= require('connect-ensure-login').ensureLoggedIn(); 

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    next(new AppError("Welcome to this site. Please log in to continue.",400))
    
  }

router.post('/register',photoController.uploadPhoto,userSchema.userChecking,authController.userRegister);
router.post('/login',authController.login);
router.get('/logout',authController.userLogout);

router.use(ensureAuthenticated)

router.get('/:userid',userController.getUserById);
router.patch('/:userid',photoController.uploadPhoto,updateUserValidation.userChecking,userController.updateUser)
router.delete('/:userid',userController.deleteUser)
router.get('/:userid/assignedTask',userController.getAssignedTask);
router.delete('/:userid/deleteimage',userController.deleteImage);

router.route('/')
.get(userController.getAllUsers)
// .post(userSchema.userChecking,userController.createUser);

// router.route('/:id')
// .get(userController.getUserById)
// .patch(userController.updateUser)
// .delete(userController.deleteUser);

// router.route('/:id/assignedtask')
// .get(userController.getAssignedTask)

module.exports=router;