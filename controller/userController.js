const AppError = require("../Error/appError");
const Todo = require("../model/todoModel");
const { use } = require("../routes/userRoute");
const User = require("./../model/userModel");
const validator = require("validator");
const globalErrorHandler = require("./../Error/globalErrorHandler");
const multer = require("multer");
const path=require("path");
const Photo = require("./../model/photoModel");
const photoController = require("./../controller/photoController");
const constants = require("./../utils/constant");
const globalSuccess=require("./../Error/globalSuccess")
const APIFeatures = require("./../utils/apiFeatures");


//Create User
exports.createUser = async (req, res, next) => {
  try {

    //Check user with that id is exist or not
    let userCheck = await User.findOne({ email: req.body.email });
    if (userCheck) {
      return next(new AppError("User with this email id is already exist", 401));
    }

    //Passed all the Validator now create user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      gender: req.body.gender,
    });

    console.log(req.body.filename);

    const savedUser = await user.save();

    //If User not saved
    if (!savedUser) {
      next(new AppError("Account not created ! Please try again", 401));
    }

    return globalSuccess.sendResponse(201, 'Your account is created successfully',savedUser, res);

  } catch (err) {
    next(globalErrorHandler(err));
  }
};

//get All users
exports.getAllUsers = async (req, res, next) => {
  try {
    let filter = {};

    if (req.params.id) filter = { user: req.params.id };
    const features = new APIFeatures(User.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const users = await User.find();
    const userget = await features.query.populate("assigned_tasks photo").select("name email") // used for seeing particular info
    const data = await userget;
    if (!userget) {
      return next(AppError("No users are there", 404));
    }

    // const pageNo = Math.round(todos.length / todosget.length);

    console.log(userget);
    res.status(302).json({
      error: false,
      message: "List of all todos are below:",
      data,
      // pageNo,
      total_results: users.length,
      result_on_this_page: userget.length,
      this_pageNo: req.query.page,
    });
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
}

//get User By id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid).populate('photo')
      .populate('assigned_tasks')
      .select("-password -__v");

    //User exist or not
    if (!user) {
      return next(new AppError("No user is assoicated with this id", 404));
    }

    // res.status(200).json({
    //   error:false,
    //   message: "The details of this account is below:",
    //   user,
    // });
    console.log(user);
    return globalSuccess.sendResponseGet(302,user,res);
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

// Update a user
exports.updateUser = async (req, res, next) => {
  try {
    let updatedUser = await User.findByIdAndUpdate(
      req.params.userid,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).select("name email photo");
    if (!updatedUser) {
      return next(new AppError("No user is assoicated with this id", 404));
    }
    if (req.file){
      // If user uploaded a photo, use it
      console.log("i am here if");
      const photoFind = await Photo.findOne({ filename: req.file.filename });
      if (photoFind) {
        updatedUser.photo = photoFind._id;
      }
    } else {
      // If user did not upload a photo, use the default photo
      console.log("i am here else");

      const defaultPhotoFind = await Photo.findOne({ filename: 'default.jpg' });
      if (defaultPhotoFind) {
        updatedUser.photo = defaultPhotoFind._id;
      }
    }
      // let updatedUsers=await updatedUser.save().
      // select("name email photo");  
    return globalSuccess.sendResponse(200, 'Your account details updated succesfully ', updatedUser, res);
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

//Delete User(soft-delete)
exports.deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndUpdate(req.params.userid, {
      active: false,
    });
    if (!deletedUser) {
      next(new AppError("User not found with this id", 404));
    }
    // res.status(200).json({
    //   error:false,
    //   message: "Your Account is removed Successfully",
    // });
    return globalSuccess.sendResponseDelete(201, 'Your account deleted successfully',res);
  } catch (err) {
    next(globalErrorHandler(err));
  }
};

//Get assign task of user
exports.getAssignedTask = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid).populate(
      "assigned_tasks"
    );
    // .select("name")

    //User Exist or not
    if (!user) {
      next(new AppError("User not found with this id", 404));
    }

    return globalSuccess.sendResponseGet(201, user, res);

  } catch (err) {
    next(globalErrorHandler(err));
  }
};

//Image delete
exports.deleteImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userid);
    if (!user) {
      next(new AppError("User not found with this id", 404));
    }
    const photoFind = await Photo.findOne({ filename:"default.jpg"});
    if (photoFind) {
      user.photo = photoFind._id;
    }
    console.log(user);
    user.save();

    return globalSuccess.sendResponse(201, 'Your profile picture deleted successfully',user, res);
  } catch (err) {
    console.log(err);
    new (globalErrorHandler(err))();
  }
}

