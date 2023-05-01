const { number } = require("joi");
const mongoose = require("mongoose");
const slugify = require("slugify");

const csvSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
    //   default: "default.jpg",
      unique:true,
    },
    url: {
      type: String,
    //   // default:
    //   //   "https://api-private.atlassian.com/users/b5cb96481e7cc2d227ac369374ebed09/avatar",
    },
    size:{
        type:Number,
    },
    extension:{
        type:String,
        // enum:["csv"],
    },
  },
  {
    timestamps: true,
  }
);
const csv = mongoose.model("csv", csvSchema);

module.exports = csv;