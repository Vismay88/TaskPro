const express = require("express");
const userRouter = require("./routes/userRoute");
const todoRouter = require("./routes/todoRoute");
const photoRouter=require("./routes/photoRoute");
const AppError = require("./Error/appError");
const globalErrorHandler = require("./Error/globalErrorHandler");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require('cookie-parser');
const LocalStrategy = require("passport-local").Strategy;
const cors = require("cors");
const path = require('path');
const User = require("./model/userModel");
const Photo=require("./model/photoModel")
const app = express();

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// app.use(express.static('public'));
app.use(express.static(__dirname+'./public/'));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false,limit: '10kb' }));

app.use(
  session({
    secret: "secret_code",
    resave: false,
    saveUninitialized: false,
    cookie:{expires :new Date(Date.now()+ 3600000000)}
  })
);
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});
// connect().use(connect.session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))
// app.use(session({
//   secret : 'secret',
//   cookie:{_expires : 600}, // time im ms
//   })
// ); 

app.use(passport.initialize()); // init passport on every route call
app.use(passport.session()); //allow passport to use "express-session"


//Serialization it set cookie-session to user's browser 
passport.serializeUser((user,done)=>{
    done(null,user.id);
});

//Deserialization used for extracting that cookie info to check user is same 
passport.deserializeUser((id, done)=>{
  User.findById(id,(err,user)=>{
   done(err,user);
  });
})

app.use("/api/v1/users", userRouter);
app.use("/api/v1/photos", photoRouter);
app.use("/api/v1/tasks", todoRouter);

app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Requested url not found:${req.originalUrl} ! please check the url`
    ),
    404
  );
});

app.use(globalErrorHandler);
module.exports = app;
