const AppError = require("../Error/appError");
const Todo = require("./../model/todoModel");
const User = require("./../model/userModel");
const user = require("./../model/userModel");
const userController = require("./userController");
const APIFeatures = require("./../utils/apiFeatures");
const Path = require("path");
const csv = require("csv-parser");
const fs = require("fs");
const todoSchema = require("./../validatation/todoValidation");
const globalErrorHandler = require("./../Error/globalErrorHandler");
const globalSuccess = require("./../Error/globalSuccess");
const { Console } = require("console");
// const { error } = require("console");

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
    return globalSuccess.sendResponseDelete(
      200,
      "Todo and its subtasks deleted successfully",
      res
    );
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

    return globalSuccess.sendResponse(
      200,
      "Task Successfully assigned to users",
      task,
      res
    );
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

    return globalSuccess.sendResponse(
      200,
      "Assignee removed successfully",
      task,
      res
    );
  } catch (err) {
    console.log;
    next(globalErrorHandler(err));
  }
};
// exports.uploadCsvFile = async (req, res, next) => {
//   try {

//     const path = Path.resolve(__dirname,'public','image1.jpg')

//     const results = [];
//     const subtasks = [];
//     console.log(req.file);
//     req.filename.pipe(fs.createWriteStream(path))
//       .on('data', async (data) => {
//         // Check if this row is a subtask
//         const isSubtask = data.types === 'subtask';
//         if (isSubtask) {
//           subtasks.push(data);
//           return;
//         }

//         const todoData = {
//           title: data.title,
//           description: data.description,
//           priority: data.priority,
//           status: data.status,
//           due_date: data.due_date,
//           assign_to: data.assign_to.split(',').map((id) => id.trim()),
//         };
//         const isValid = ValidateTodoData(todoData);
//         if (!isValid) throw new Error('Invalid todo data');
//         const todo = new Todo(todoData);
//         await todo.save();
//         results.push(todo);
//         // If there are any subtasks for this main task, create new Todo documents for each subtask
//         // and add their _id to the subtasks array of the main task
//         const subtasksForMainTask = subtasks.filter(
//           (subtask) => subtask.parent_task === data.title
//         );
//         for (const subtaskData of subtasksForMainTask) {
//           const subtask = new Todo({
//             title: subtaskData.title,
//             description: subtaskData.description,
//             priority: subtaskData.priority,
//             status: subtaskData.status,
//             due_date: subtaskData.due_date,
//             assign_to: subtaskData.assign_to.split(',').map((id) => id.trim()),
//             types: 'subtask',
//           });
//           const isValidSubtask = ValidateTodoData(subtaskData);
//           if (!isValidSubtask) throw new Error('Invalid subtask data');
//           await subtask.save();
//           results.push(subtask);
//           todo.subtasks.push(subtask._id);
//         }
//         // Clear the subtasks array so it's ready for the next main task
//         subtasks.length = 0;
//       })
//       .on('end', () => {
//         // Once all rows have been processed, send a response with the number of documents added to the database
//         res.json({
//           status: 'success',
//           message: `${results.length} documents added to the database`,
//         });
//       });
//   } catch (err) {
//     // next(err);
//     console.log(err)
//   }}

// exports.uploadCsvFile = async (req, res, next) => {
//   try {
//     //Conver csv file into json Array
//     var temp;
//     var arrayToInsert = [];
//     const subtasks = [];
//     const idsOfAll=[];
//     csvToJson()
//       .fromFile(req.file.path)
//       .then((jsonObj) => {
//         // console.log(jsonObj);
//         for (let i = 0; i < jsonObj.length; i++) {
//           // if(jsonObj.types==="subtask"){
//           var subTaskRow = {
//             title: jsonObj[i]["title"],
//             description: jsonObj[i]["description"],
//             priority: jsonObj[i]["priority"],
//             due_date: jsonObj[i]["due_date"],
//             status: jsonObj[i]["status"],
//             assign_to: jsonObj[i]["assign_to"],
//             types: jsonObj[i]["types"],
//             maintask: jsonObj[i]["maintask"],
//             subtasks:jsonObj[i]["subtasks"],
//           };
//           const todo =new Todo(subTaskRow);
//            todo.save();
//           arrayToInsert.push(subTaskRow);
//         }

//         for (let i = 0; i <jsonObj.length; i++) {
//         if(arrayToInsert[i].types==='subtask'){
//           console.log("i am subtask"+"my main number is:"+i)
//           const idFind= Todo.findOne({title: arrayToInsert[i].title})
//           console.log(""+idFind)
//           }
//         }
//         //insertmany is used to save bulk data in database.
//         //saving the data in collection(table)
//         // Todo.insertMany(arrayToInsert, async (err, data) => {
//         //   if (err) {
//         //     console.log(err);
//         //   } else {
//         //     let saveTodo,save1;
//         //     for (let i = 0; i < jsonObj.length; i++) {

//         //     }

//             return res.status(201).json({
//               message: "It is done",
//             });
//         //   }
//         // });
//       });
//   } catch (err) {
//     console.log(err);
//     next(globalErrorHandler(err));
//   }
// };

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

// exports.uploadCsvFile = async (req, res, next) => {
//   try {
//     // Parse the CSV file using csv-parser
//     const results = [];
//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (data) => results.push(data))
//       .on("end", async () => {
//         // Create an object to hold the main tasks and subtasks separately
//         const mainTasks = [];
//         const subTasks = [];

//         // Separate the main tasks and subtasks
//         results.forEach((row) => {
//           const task = {
//             title: row.title,
//             description: row.description,
//             priority: row.priority,
//             due_date: row.due_date,
//             status: row.status,
//             assign_to: row.assign_to,
//             types: row.types,
//             parentNo: row.parentNo,
//           };

//           if (task.types === "main") {
//             mainTasks.push(task);
//           } else {
//             subTasks.push(task);
//             // console.log(subTasks);
//           }
//         });
//         // Save the main tasks and get their IDs
//         const mainTaskIds = [];
//         // if(mainTasks.types==="main"){
//         for (const task of mainTasks) {
//           const newTask = new Todo({
//             title: task.title,
//             description: task.description,
//             priority: task.priority,
//             due_date: task.due_date,
//             status: task.status,
//             assign_to: task.assign_to,
//             types: task.types,
//           });
//           const savedTask = await newTask.save();
//           console.log("Main task is:" + savedTask);
//           mainTaskIds[task.parentNo] = savedTask._id;
//           console.log("Assoicated maintask" + mainTaskIds);
//           mainTaskIds.push(savedTask._id);
//           // console.log("Id of main tasks:"+savedTask._id);
//         }
//         // }
//         // Assign the subtasks to their main tasks using their srno
//         // const subTaskIds = [];

//         for (const subTask of subTasks) {
//           if (!subTask.parentNo) {
//             return res.status(404).json({
//               data: subTask,
//               message: "There is no main task for this",
//             });
//           }
//           const parentTaskId = mainTaskIds[subTask.parentNo];
//           if (parentTaskId) {
//             const newSubTask = new Todo({
//               title: subTask.title,
//               description: subTask.description,
//               priority: subTask.priority,
//               due_date: subTask.due_date,
//               status: subTask.status,
//               assign_to: subTask.assign_to,
//               types: subTask.types,
//             });

//             const savedSubTask = await newSubTask.save();
           
//             console.log("Subtask:" + savedSubTask);
//             const parentTask = await Todo.findById(parentTaskId);
//             console.log("Corrosponding id of main task:" + parentTask._id);
//             parentTask.subtasks.push(savedSubTask._id);
//             await parentTask.save(); // Save the changes to the parent main task to the database
//             // if(subTask.srno){

//             // }
//             // console.log("subtask is:"+savedSubTask);
//             // console.log("id of savedtasks is:"+savedSubTask._id);

//             // results.forEach(async(row)=>{
//             //   if(!row.srno){
//             // const parentTask = await Todo.findById(parentTaskId);

//             //   }
//             // })
//           }
//         }
//         return res.status(201).json({
//           message: "Data saved successfully",
//         });
//       });
//   } catch (err) {
//     console.log(err);
//     next(globalErrorHandler(err));
//   }
// };



//////////////////////////

exports.uploadCsvFile = async (req, res, next) => {
  try {
    // Parse the CSV file using csv-parser
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Create an object to hold the main tasks and subtasks separately
        let mainTasks = {};
        const subTasks = [];
        let subTasksof = {};


        // Separate the main tasks and subtasks
        results.forEach((row,index) => {
          const task = {
            title: row.title,
            description: row.description,
            priority: row.priority,
            due_date: row.due_date,
            status: row.status,
            assign_to: row.assign_to,
            types: row.types,
            srno: row.srno,
            index:row.index
          };

          if (task.types === 'main') {
            mainTasks[index] = task;
            // console.log("................")
            console.log("Main task:"+JSON.stringify(mainTasks));
            // console.log("................")
          } else {
            // console.log("................")
            // subTasks.push(task);
            subTasksof[index]=task;
            console.log("sub task:"+JSON.stringify(subTasksof));
            // console.log("Subtask is:"+JSON.stringify(subTasks)+"Sr no is:"+task.srno)
          }
        });
        // Save the main tasks and get their IDs
             const mainTaskIds = [];
        for (const [index, task] of Object.entries(mainTasks)) {
          const newTask = new Todo({
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            status: task.status,
            assign_to: task.assign_to,
            types: task.types,
          });
          const savedTask = await newTask.save();
          mainTasks[index] = savedTask._id;// Store the task object with its id as well
          mainTaskIds.push(mainTasks[index]);
          console.log("First one:"+mainTasks[index]);
        }
        // Assign the subtasks to their main tasks using the corresponding row number
        for (const [index,subTask]of Object.entries(subTasksof)) {
          const parentTask = mainTasks[subTask.srno-1];
          console.log(subTask.srno);
          // console.log("task 1:"+mainTasks[1]) // Get the main task object using its corresponding row number
          console.log("task 2:"+mainTasks[2]);
          // console.log("Below:");
          console.log(parentTask);
          if (parentTask) {
            const newSubTask = new Todo({
              title: subTask.title,
              description: subTask.description,
              priority: subTask.priority,
              due_date: subTask.due_date,
              status: subTask.status,
              assign_to: subTask.assign_to,
              types: subTask.types,
              // parent: parentTask.id, // Set the parent field to the main task's id
            });

            const savedSubTask = await newSubTask.save();
            console.log("Id of saved subtask:"+savedSubTask._id);
            const parentTaskFind = await Todo.findById(parentTask);
            console.log("The parent id is:"+parentTaskFind);
            parentTaskFind.subtasks.push(savedSubTask._id);
            await parentTaskFind.save();
            // parentTask.subtasks.push(savedSubTask._id); // Push the subtask object to the parent main task's subtasks array
            // await Todo.updateOne({ _id: parentTask.id }, { subtasks: parentTask.subtasks }); // Update the parent main task's subtasks array in the database
          }
        }

        return res.status(201).json({
          message: 'Data saved successfully',
        });
      });
  } catch (error) {
    console.log(error);
    next(globalErrorHandler(error));
  }
};