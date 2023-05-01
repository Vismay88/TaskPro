const express=require('express');
const router = express.Router();
const todoController=require('./../controller/todoController');
const userController=require('./../controller/userController');
const todoSchema = require("./../validatation/todoValidation");
const csvController=require("./../controller/csvController");

router.route('/').
post(todoSchema.todoChecking,todoController.createTodo)
.get(todoController.getAllTodos);

// router.route('/todoo').get(todoController.getTodoo); //aggrigation things
router.route('/:id').get(todoController.getTodo)
.patch(
    todoSchema.todoChecking,
    todoController.updateTodo)
.delete(todoController.deleteTodo);

router.route('/:id/assigntodo')
.post(todoController.assignTo)
.patch(todoController.deleteAssignTo);

router.route('/:id/subtodo')
.post(todoController.createSubTodo)
// .get(todoController.getSubTodo);
// .get(todoController.getAllSubTodo);

router.post('/upload',csvController.uploadCsv,todoController.uploadCsvFile)

// router.post('/:id/assign/:assigneeId', todoController.assignTodo);
// router.delete('/:id/assign/:assigneeId', todoController.deleteAssignedTodo);
module.exports = router;