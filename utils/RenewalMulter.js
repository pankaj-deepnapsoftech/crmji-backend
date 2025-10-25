const multer = require("multer");
const path = require("path");


// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// Define allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/vnd.ms-excel", // For older Excel files (.xls)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // For .xlsx files
    "text/csv",
    "application/csv",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, PDF, Excel, and CSV files are allowed."
      ),
      false
    );
  }
};

// Multer middleware to handle file uploads
const upload = multer({ storage, fileFilter });

// Middleware to handle multiple file uploads
const uploadMiddleware = upload.fields([
  { name: "doc", maxCount: 1 },
  { name: "term", maxCount: 1 },
  { name: "contractAttachment", maxCount: 1 },
  { name: "excel", maxCount: 1 }, // For Excel/CSV file uploads
]);

module.exports = uploadMiddleware;