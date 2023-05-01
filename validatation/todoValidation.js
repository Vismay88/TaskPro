const Joi = require("joi")
.extend(require('@joi/date'));
const { date } = require("joi");
const constant=require("./../utils/constant");
const Todo=require('./../model/todoModel')

exports.todoChecking=async(req,res,next)=>{
  const todoSchema = await Joi.object().keys(
  {
    title:Joi.string().min(2).max(50).pattern(/^[A-Za-z0-9\s\-_,\.;:()]+$/)
    .message({
      "string.empty":"Title can not be empty Please enter the Title",
      "any.required":"Any title required",
      "string.min":"Title length should be more than 2 characters",
      "string.max":"Title length should not be more than 50 characters",
    }).required(),

    description:Joi.string().min(5).max(300)
    .message({
      "string.empty":"Description can not be empty Please enter the description",
      "string.min":"Description length should be more than 5 characters",
      "string.max":"Description length should not be more than 50 characters",
    }),

    priority:Joi.string().valid('low', 'medium', 'high').optional()
    .messages({
      "string.empty":"Please fill the priority",
      "any.only":"Priority must be one of them:[low,medium,hard]"
    }),

    status:Joi.string().valid('starting','ongoing','completed').default('ongoing')
    .messages({
      "string.empty":"Please assign status of task",
      "any.only":"status must be one of them:['starting','ongoing','completed']"
    }),

    createdAt:Joi.date().format('YYYY-MM-DD').raw(),

    assign_to:Joi.array().optional().messages({
      "string.empty":"please assign user it should not be an empty!",
      "any.only":"user id should be right"
    }),

    due_date: Joi.date().min('now').raw().optional()
    .messages({
      "string.empty":"Please Enter the date",
      "any.only":"due date must be greater than creadted date"
    }),

    active:Joi.boolean().default(true).optional()
    .messages({
      "any.only":"status must be one of them:['starting','ongoing','completed']"
    }),

    types:Joi.string().valid('main','subtask').optional()
    .messages({
      "string.empty":"please Enter task type",
      "any.only":"task only have 2 types please choose one:main or subtask "
    }),

    subtasks: Joi.array().optional()
  }
);

let options = { abortEarly: false };
 const { check, error } = todoSchema.validate(req.body,options);
    if (error) {
      const errorMessages = error.details.map((err) => err.message);
      console.log(errorMessages);
    return res.status(400).json({
        "error":constant.TRUE,
        "message": errorMessages,
      })
    }
  next()
}