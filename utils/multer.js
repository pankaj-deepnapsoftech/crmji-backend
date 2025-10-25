const multer = require("multer");
const path = require('path');
const fs = require("fs");

// Define your upload directory
const uploadDir = path.join(__dirname, '../tmp', 'uploads');

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null,  uniqueSuffix + "-" + file.originalname);
  }
});

exports.upload = multer({ 
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only Excel files
        const filetypes = /xlsx|xls|csv/;
        const allowedMimetypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/csv'
        ];
        const mimetype = allowedMimetypes.includes(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .xlsx, .xls and .csv format allowed!'));
    }
});


const imageFilter = function (req, file, cb) {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

exports.chatimage = multer({
  storage: storage,
  fileFilter: imageFilter
});

