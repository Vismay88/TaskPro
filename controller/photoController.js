const constant=require("./../utils/constant");
const multer = require("multer");
const Photo = require("./../model/photoModel");
const AppError=require("./../Error/appError");
const globalSuccess = require("./../Error/globalSuccess");


//For photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const extensionImage = file.mimetype.split("/")[1];
    console.log(extensionImage);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const multerFilter = (req,file, cb) => {  
  if (file.mimetype==="image/jpg" || file.mimetype==="image/png" ||file.mimetype==="image/jpeg" ) {
    cb(null, true);
  } 
  else {
    cb(new AppError("Not an image! please upload only jpg/jpeg/png images.", 400), false);
  }
};

const upload = multer({
   storage,
   fileFilter:multerFilter,
   limits:{fileSize:1000000}
  });

 
exports.uploadPhoto = (req, res, next) => {
  upload.single("photo")(req, res, async (err) => {
    if (err) {
      console.log(err);
      return next(new AppError(err.message, 400))
    }
    let filename;
    if (req.file) {
      // console.log("Hin")
      filename = req.file.filename;
      const photo = new Photo({
        filename,
        url: `http://localhost:3000/public/images/${filename}`,
        extension: filename.split(".")[1],
        size:req.file.size
      });

      photo.save((err) => {
        if (err) {
          console.log(err);
          return next(new AppError(err.message, 400))
        }


         next();
        //  return globalSuccess.sendResponse(
        //   201,
        //   "Profic picture uploaded succesfully",
        //   photo,
        //   res
        // );
      });
    } else {

      const defaultPhoto = await Photo.findOne({ filename: 'default.jpg' });
      next();

      // return globalSuccess.sendResponse(201,"Profic picture uploaded succesfully",defaultPhoto,res);      
      // return res.json(responseData);
    }
  });
};

