const constant = require("./../utils/constant");
const multer = require("multer");
const AppError = require("./../Error/appError");
const globalSuccess = require("./../Error/globalSuccess");
const Todo = require("./../model/todoModel");
const csvToJson = require("csvtojson");
const csvModel = require("./../model/csvModel");
const { fileURLToPath } = require("url");

//For csv upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/document");
  },
  filename: (req, file, cb) => {
    const extensionCsv = file.mimetype.split("/")[1];
    console.log(extensionCsv);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv") {
    cb(null, true);
  } else {
    cb(
      new AppError("Not a csv file! please upload csv files only", 400),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter: multerFilter,
  limits: { fileSize: 10000000},
});

exports.uploadCsv = (req, res, next) => {
  upload.single("csv")(req, res, async (err) => {
    if(!req.file){
      return next(new AppError("Please attech csv files",400));
    }
    if (err) {
      console.log(err);
      return next(new AppError(err.message, 400));
    }
    let filename;
    if (req.file) {
    filename = req.file.filename;
      console.log("I am at csv req.file portion");
      console.log(req.file);
      console.log(typeof(req.file))
      console.log(filename)

      const csv=new csvModel({
        filename,
        url: `http://localhost:3000/public/document/${filename}`,
        extension:filename.split(".")[1],
        size:req.file.size
      });
      csv.save((err) => {
        if (err) {
          console.log(err);
          return next(new AppError(err.message, 400))
        }
         next();
        //  return globalSuccess.sendResponse(
        //   201,
        //   "file uploaded succesfully",
        //   csv,
        //   res
        // );
      });
    }
        // return globalSuccess.sendResponse(201,"Profic picture uploaded succesfully",defaultPhoto,res);      
        // return res.json(responseData)
    });
  };
