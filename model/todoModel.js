const mongoose = require('mongoose');
const slugify = require('slugify');
const joi=require('joi')

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please Enter The Task Title'],
    unique: true,
    trim: true,
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'high',
  },
  status: {
    type: String,
    enum: ['starting', 'ongoing', 'completed'],
    default: 'ongoing',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  due_date: {
    type: Date,
    default: Date.now(),
  },
  active:{
    type:Boolean,
    default:true,
    select:false
  },
  assign_to:[ {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
],
  // parent_task: {
  //   type: mongoose.Schema.ObjectId,
  //   ref: 'Todo',
  // },
  types:{
    type:String,
    enum:['main','subtask'],
    default:'main'
  },
  subtasks: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Todo',
    },
  ]
});

todoSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

//Soft-Delete
todoSchema.pre(/^find/,function(next){
  this.find({active: {$ne:false}});
  next();
})

const Todo = mongoose.model('Todo', todoSchema);
module.exports = Todo;