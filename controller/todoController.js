const AppError = require("../Error/appError");
const Todo = require("./../model/todoModel");
const User = require("./../model/userModel");
const user = require("./../model/userModel");
const userController = require("./userController");
const APIFeatures = require("./../utils/apiFeatures");
const path=require("path");
var csvToJson= require('csvtojson');  
const todoSchema = require("./../validatation/todoValidation");
// const globalErrorHandler = require('./../Error/globalError');
const globalErrorHandler = require("./../Error/globalErrorHandler");
const globalSuccess = require("./../Error/globalSuccess");
//create Task and Subtask in
exports.createTodo = async (req, res, next) => {
  try {
    const { title, description, subtasks, assign_to } = req.body; // Create parent todo
    const parentTodo = new Todo({
      title,
      description,
      assign_to,
      subtasks: [],
    });

    const titleCheck = await Todo.findOne({ title: req.body.title });
    if (titleCheck) {
      return next(new AppError("This title name is already exists", 400));
      console.log(titleCheck);
    }

    await parentTodo.save();
    console.log(parentTodo);

    // Here we check for subtask
    if (subtasks && subtasks.length > 0) {
      const subTaskIds = [];

      for (const subtask of subtasks) {
        const newSubTask = new Todo({
          title: subtask.title,
          description: subtask.description,
          assign_to: subtask.assign_to,
          parent: parentTodo._id,
        });

        const savedSubTask = await newSubTask.save();
        subTaskIds.push(savedSubTask._id);
        console.log(savedSubTask);
      }
      parentTodo.subtasks = subTaskIds;
      await parentTodo.save();
    }
    return globalSuccess.sendResponse(
      201,
      "Todo created succesfully",
      parentTodo,
      res
    );
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

//Create Subtodo-old one
exports.createSubTodo = async (req, res, next) => {
  try {
    const task = await Todo.findById(req.params.id);
    if (!task) {
      next(new AppError("Main task is not found", 404));
    }
    task.subtasks.push(req.body.id);
    console.log();
    await task.save();

    console.log("task==>", task);
    res.status(201).json({
      error: false,
      message: "Subtask created successfully",
      task,
    });
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

//get All Todos
// exports.getAllTodos = async (req, res) => {
//   try {
//     const todos = await Todo.find().populate("assign_to").populate("subtasks");
//     res.status(200).json({
//       status: "success",
//       results: todos.length,
//       data: {
//         todos,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: err.message,
//     });
//   }
// };

//Implemented filter,sort,pagination and limitfields
exports.getAllTodos = async (req, res, next) => {
  try {
    let filter = {};

    if (req.params.id) filter = { todo: req.params.id };
    const features = new APIFeatures(Todo.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const todos = await Todo.find();
    const todosget = await features.query.populate("assign_to"); // used for seeing particular info
    const data = todosget;
    if (!todosget) {
      return next(AppError("No todos are there", 404));
    }

    const pageNo = Math.round(todos.length / todosget.length);

    console.log(todosget);
    res.status(302).json({
      error: false,
      message: "List of all todos are below:",
      data,
      // pageNo,
      total_results: todos.length,
      result_on_this_page: todosget.length,
      this_pageNo: req.query.page,
    });
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};
//get Todo
exports.getTodo = async (req, res, next) => {
  try {
    const user = await Todo.findById(req.params.id)
      .populate("assign_to")
      .populate("subtasks");

    if (!user) {
      return next(
        new AppError(
          "No user is associated with this id.Please check your id again",
          404
        )
      );
    }
    // res.status(200).json({
    //   error: false,
    //   message:"Todo which is associated with given id is below:",
    //   data,
    // });

    return globalSuccess.sendResponse(200, "success", user, res);
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

//get-subtodo
exports.getSubTodo = async (req, res, next) => {
  try {
    let subTaskTodo;
    const getTodo = await Todo.findById(req.params.id);
    if (!getTodo) {
      next(new AppError("Task is not found", 404));
    }
    const getSubTodo = getTodo.subtasks.map(async (task) => {
      console.log("task==>", task);
      const ans = await Todo.findById(task);
      console.log("ans==>", ans);
      return ans;
    });
    const resposne = await Promise.all([getTodo, getSubTodo]);
    // res.status(201).json({
    //   error: "false",
    //   message: "Subtask with this id is assoicated below:",
    //   resposne,
    // });
    return globalSuccess.sendResponse(
      200,
      "Subtask with this id is assoicated below:",
      user,
      res
    );
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

exports.updateTodo = async (req, res, next) => {
  try {
    const titleCheck = await Todo.findOne({ title: req.body.title });
    if (titleCheck) {
      return next(new AppError("This title name is already exists", 400));
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!todo) {
      return next(new AppError("No todo is associated with this id", 404));
    }

    // Update subtask statuses
    else if (
      todo.status === "completed" &&
      todo.subtasks &&
      todo.subtasks.length > 0
    ) {
      const subtaskUpdates = todo.subtasks.map((subtaskId) =>
        Todo.findByIdAndUpdate(subtaskId, { status: "completed" })
      );
      await Promise.all(subtaskUpdates);
    }
    // res.status(200).json({
    //   // status: "success",
    //   error: false,
    //   message: "Your updated task is below:",
    //   todo,
    // });
    return globalSuccess.sendResponse(
      200,
      "Todo updated successfully",
      todo,
      res
    );
  } catch (err) {
    console.log(err);
    next(globalErrorHandler(err));
  }
};

//Soft-Delete Todo
exports.deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return next(new AppError("No todo is associated with this id", 404));
    }
    // Soft delete the todo and its subtasks
    todo.active = false;
    await todo.save();

    if (todo.subtasks && todo.subtasks.length > 0) {
      await Todo.updateMany(
        { _id: { $in: todo.subtasks } },
        { $set: { active: false } }
      );
    }
    // res.status(200).json({
    //   error: false,
    //   message: "Todo and its subtasks deleted successfully",
    // });
    return globalSuccess.sendResponseDelete(200,"Todo and its subtasks deleted successfully",res)
  } catch (err) {
    next(globalErrorHandler(err));
  }
};

// Assign a task and subtask to a user
exports.assignTo = async (req, res, next) => {
  try {
    const task = await Todo.findById(req.params.id);
    console.log(task);
    if (!task) {
      return next(new AppError("No todo is associated with this id", 404));
    }
    const user = await User.findById(req.body.id);
    const userid = req.body.id;
    console.log(userid);

    userCheck = await User.findById(userid);
    if (!userCheck) {
      return next(new AppError("No user is associated with this id", 404));
    }

    task.assign_to.push(userid);
    await task.save();
    console.log(task);
    user.assigned_tasks.push(task);
    await user.save();
  
    return globalSuccess.sendResponse(200,"Task Successfully assigned to users",task,res);

  } catch (err) {
    console.log(err.name);
    next(globalErrorHandler(err));
  }
};

//Remove asssignee from the task
exports.deleteAssignTo = async (req, res, next) => {

  try {
    const task = await Todo.findById(req.params.id);
    console.log(task);

    if (!task) {
      return next(new AppError("No todo is associated with this id", 404));
    }

    const userfind = await User.findById(req.body.id);
    const userid = req.body.id;
    console.log(userid);

    userCheck = await User.findById(userid);
    if (!userCheck) {
      return next(new AppError("No user is associated with this id", 404));
    }

    const index = task.assign_to.indexOf(userid);
    if (index > -1) {
      task.assign_to.splice(index, 1);
      await task.save();
    }

    const indexUser = userfind.assigned_tasks.indexOf(req.params.id);
    if (indexUser > -1) {
      userfind.assigned_tasks.splice(indexUser, 1);
      await userfind.save();
    }

    return globalSuccess.sendResponse(200,"Assignee removed successfully",task,res);
  } catch (err) {
    console.log;
    next(globalErrorHandler(err));
  }
};

exports.uploadCsvFile=async(req,res,next)=>{
  try{
   //Conver csv file into json Array
   var temp;
   var arrayToInsert = [];
   csvToJson().fromFile(req.file.path)
   .then((jsonObj)=>{
    console.log(jsonObj);
  for(let i=0;i<jsonObj.length;i++){
    // if(jsonObj.types==="subtask"){
    var subTaskRow={
      title:jsonObj[i]["title"],
      description:jsonObj[i]["description"],
      priority:jsonObj[i]["priority"],
      due_date:jsonObj[i]["due_date"],
      status:jsonObj[i]["status"],
      assign_to:jsonObj[i]["assign_to"],
      types:jsonObj[i]["types"]
    // // temp = parseFloat(jsonObj[x].title);
    // jsonObj[x].title = temp;  
    // temp = parseFloat(jsonObj[x].description)  
    // jsonObj[x].description = temp;  
    // temp = parseFloat(jsonObj[x].status)  
    // jsonObj[x].status = temp;  
    // temp = parseFloat(jsonObj[x].priority)  
    // jsonObj[x].priority = temp;  
    // temp = parseFloat(jsonObj[x].due_date)  
    // jsonObj[x].due_date = temp;  
    // }
  }
    arrayToInsert.push(subTaskRow);
};  
//insertmany is used to save bulk data in database.
//saving the data in collection(table)
 Todo.insertMany(arrayToInsert,(err,data)=>{  
  if(err){  
  console.log(err);  
  }else{  
    
    return res.status(201).json({
      message:"It is done"
    })
  }  
     });  
  });  
  }catch(err){
    console.log(err.message)
    next(globalErrorHandler(err));
  }

}


//Addinational using aggrigation
// exports.getTodoo = async (req, res) => {
//   const todos = await Todo.aggregate([
//     // {
//     //   // $match: {
//     //   //   types: 'main',
//     //   // },
//     // },
//     {
//       $project: {
//         _id: 0,
//         title: 1,
//         description: 1,
//         status: 1,
//         priority: 1,

//         due_date: 1,
//         types: 1,
//       },
//     },
//     // {
//     //   $group: {
//     //     _id:'$title'
//     //     // numTodos: { $sum: 1 },
//     //   },
//     // },
//     {
//       $sort: { createdAt: -1 },
//     },
//     {
//       $limit: 10,
//     },
//   ]);
//   console.log(todos);
//   res.status(200).json({
//     status: "success",
//     data: {
//       todos,
//     },
//   });
// };
