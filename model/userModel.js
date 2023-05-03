const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const constants = require("./../utils/constant");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password."],
      minlength: [8, "Password must have at least 8 characters"],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!'
      }
    },
    gender: {
      type: String,
      enum: [constants.MALE, constants.FEMALE, constants.OTHER],
      default: constants.MALE,
    },

    photo: {
      type: mongoose.Schema.ObjectId,
      ref: "Photo",
    },

    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    assigned_tasks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Todo",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
 // Delete passwordConfirm field
 this.passwordConfirm = undefined;
  next();
});

userSchema.methods.validPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

//Soft Delete
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); // this points to the current query
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
