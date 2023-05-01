const Joi = require("joi");
const constant=require("./../utils/constant");
const userController=require('./../controller/userController')

exports.userChecking = async (req, res, next) => {
  const userSchema =  Joi.object().keys(
    {
    name: Joi.string()
      .pattern(/^[A-Za-z\s]+$/)
      .messages({
        "string.empty": "Name can not be empty.Please Enter your name!",
        "string.pattern.base": "Please enter alphabetes only",
        "any.required": "Name is required",
      })
      .required(),

    email: Joi.string()
      .pattern(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/)
      .messages({
        "string.empty": "Email can not be an empty",
        "string.pattern.base": "Please enter the valid email address",
        "any.required": "Email is required",
      })
      .required(),

    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,12}$/)
      .messages({
        "string.empty": "password cannot be empty",
        "string.pattern.base": "Please enter valid password",
        "any.required": "Password is required",
        "string.min": "Password length must be at minimum 8 characters long",
      }).required(),

      photo:Joi.string().allow(null,'').optional(),

      gender:Joi.string().valid('male','female','other')
      .messages({
        "string.empty":"Please choose your gender",
        "any.only":"gender must be one of them:[male,female,other]"
      }),
      assigned_task:Joi.array(),
  });

  let options = { abortEarly: false };
  if(req.file){
    console.log("fsvd")
  }
  const { check, error } =  userSchema.validate(req.body,options);
  if (error) {
    const errorMessages = error.details.map((err) => err.message);
    console.log(errorMessages);
    return res.status(400).json({
      // Error: errorMessages,
      "error":constant.TRUE,
      "message": errorMessages,
    });
  }
  next();
};
