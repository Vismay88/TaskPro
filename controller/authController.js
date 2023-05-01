const User = require("./../model/userModel");
const globalErrorHandler = require("./../Error/globalErrorHandler");
const AppError = require("../Error/appError");
const { use } = require("../routes/userRoute");
const passport = require("passport");
const Photo=require("./../model/photoModel")
const LocalStrategy = require("passport-local").Strategy;
const constant=require("./../utils/constant");
const globalSuccess=require("./../Error/globalSuccess")

//Passport use method
passport.use(
  new LocalStrategy(
      {
          usernameField: "email",
          passwordField: "password",
      },
      
      async function (email, password, done) {
    try {
        const user = await User.findOne({ email }).select("+password");
        
        if (!user) {
            return done(null, false, { message: "Incorrect email!Please enter correct email" });
      }
      const match = await user.validPassword(password);
      if (!match) {
        return done(null, false, { message: "Incorrect password!Please enter correct password" });
      }
      return done(null, user);
  } catch (err) {
      return done(err);
  }
}
)
);
exports.userRegister = async (req, res, next) => {
  try {
    const userCheck = await User.findOne({ email: req.body.email });
    if (userCheck) {
      next(new AppError("User with this email id is already exist", 401));
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      gender: req.body.gender,
      photo:req.file
    });

   console.log("Hi");
    if (req.file ){
      // If user uploaded a photo, use it
      console.log("i am here if");
      const photoFind = await Photo.findOne({ filename: req.file.filename });
      if (photoFind) {
        user.photo = photoFind._id;
      }
    } else {
      // If user did not upload a photo, use the default photo
      console.log("i am here else");

      const defaultPhotoFind = await Photo.findOne({ filename: 'default.jpg' });
      if (defaultPhotoFind) {
        user.photo = defaultPhotoFind._id;
      }
    }

    const savedUser = await user.save();
    //If User not saved
    if (!savedUser) {
      next(new AppError("Account not created please try again", 401));
    }
    return globalSuccess.sendResponse(201, 'Your account is created successfully',savedUser, res);
  } catch (err) {
    console.log(err.message)
    next(globalErrorHandler(err));
  }
};

exports.login=async(req,res,next)=>{
    passport.authenticate('local',function(err,user,info){
        if(err){
            return next(err);
        }
        if(!user){
            return res.status(401).json({
                error:constant.TRUE,
                message:info.message,
            });
        }
        req.logIn(user,function(err){
            if(err){
                return next(err);
            }
            return globalSuccess.sendResponse(200, 'You have been successfully logged in ',user, res);
           
        });
    })(req,res,next);
};

exports.userLogout = (req, res) => {
 
    req.session.destroy(function (err) {
        if (!err) {
            res.status(200).clearCookie('connect.sid', {path: '/'}).json({
              error:constant.FALSE,
              message: "You have successfully logged out!"
            });
        } 
         else{
            console.log(err);
            next(globalErrorHandler(err))
         }
        });
    }