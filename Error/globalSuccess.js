exports.sendResponse = (statusCode, message, data, res) => {
    return res.status(statusCode).json({
       error:false,
      message,
      data,
    });
  };

  exports.sendResponseGet = (statusCode,data, res) => {
    return res.status(statusCode).json({
       error:false,
      // message,
      data,
    });
  };

  exports.sendResponseDelete = (statusCode,message,res) => {
    return res.status(statusCode).json({
       error:false,
      message,
      // data,
    });
  };