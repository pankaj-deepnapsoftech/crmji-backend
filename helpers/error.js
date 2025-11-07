class ErrorHandler extends Error{
  constructor(message, statusCode){
      super(message);
      this.statusCode = statusCode;
  }
}

const TryCatch = (passedFunc)=> async (req, res, next)=>{
  try{
    await passedFunc(req, res, next);
  } catch(error) {
    console.log('error', error)
    next(error);
  }
}

const errorMiddleware = (err, req, res, next) => {
  err.message ||= "Internal server error";
  err.statusCode ||= 500;

  // Duplicate key error
  if(err.code === 11000){
      const error = Object.keys(err.keyPattern).join(", ");
      err.message = `Duplicate field - ${error}`;
      err.statusCode = 400;
  }
  // CastError
  if(err.name === 'CastError'){
      const errorPath = err.path;
      err.message = `Invalid format of ${errorPath}`;
      err.statusCode = 400;
  }
  
  // SMTP Authentication errors
  if(err.code === 'EAUTH' || err.responseCode === 535 || err.message?.includes('535') || err.message?.includes('authentication failed')){
      err.statusCode = 500;
      // Keep the user-friendly message from sendEmail helper
      if(!err.message.includes('authentication failed') && !err.message.includes('EMAIL_ID')){
          err.message = "Email service authentication failed. Please contact support to verify email configuration.";
      }
  }

  return res.status(err.statusCode).json({
      status: err.statusCode,
      success: false,
      message: err.message
  })
}

module.exports = {errorMiddleware, TryCatch, ErrorHandler};