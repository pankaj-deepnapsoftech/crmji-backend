const express = require("express");
const mongoose = require("mongoose");
const Excel = require("../../models/excel");
const doc = require("pdfkit");
const csv = require("csvtojson");
const path = require("path");
const xlsx = require("xlsx");
const fs = require("fs");
const moment = require("moment"); // Install with `npm install moment`

// Create a new record
const createRecord = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      custumerName,
      phnNumber,
      contractType,
      otherContractType,
      contractNumber,
      productName,
      mode,
      otherMode,
      renewalDate,
      lastRenewalDate,
      renewalTimes,
      doc,
      years,
      months,
      status,
      remarks,
    } = req.body;

    // Base URL where your backend is hosted
    const baseUrl = process.env.IMG_BASE_URL;

    // Construct public URLs for images
    // const doc = req.files["doc"]
    //   ? `${baseUrl}/images/${req.files["doc"][0].filename}`
    //   : null;
    // const term = req.files["term"]
    //   ? `${baseUrl}/images/${req.files["term"][0].filename}`
    //   : null;
    const contractAttachment = req.files["contractAttachment"]
      ? `${baseUrl}/images/${req.files["contractAttachment"][0].filename}`
      : null;

    const newRecord = new Excel({
      organization: req.user.organization,
      creator: req.user.id,
      custumerName,
      phnNumber,
      contractType: contractType === "Other" ? otherContractType : contractType,
      otherContractType: contractType === "Other" ? otherContractType : null,
      contractNumber,
      productName,
      doc,
      years,
      months,
      mode: mode === "Other" ? otherMode : mode,
      otherMode: mode === "Other" ? otherMode : null,
      contractAttachment,
      renewalDate,
      lastRenewalDate,
      renewalTimes,
      status,
      remarks,
    });

    await newRecord.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all records
const getAllRecords = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const records = await Excel.find({
      organization: req.user.organization,
    }).sort({ createdAt: -1 });

    const formattedRecords = records.map((record) => ({
      _id: record._id,
      contractType: record.contractType || "N/A",
      otherMode: record.otherMode || "N/A",
      custumerName: record.custumerName || "N/A",
      phnNumber: record.phnNumber || "N/A",
      contractNumber: record.contractNumber || "N/A",
      productName: record.productName || "N/A",
      doc: record.doc || "N/A",
      mode: record.mode || "N/A",
      contractAttachment: record.contractAttachment || "N/A",
      renewalDate: record.renewalDate || "N/A",
      lastRenewalDate: record.lastRenewalDate || "N/A",
      renewalTimes: record.renewalTimes || "N/A",
      status:record.status || "N/A",
      remarks:record.remarks || "N/A",
      createdAt: record.createdAt || new Date(),
    }));

    res.status(200).json({ success: true, data: formattedRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single record by ID
const getRecordById = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const record = await Excel.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a record by ID

const updateRecord = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const {
      custumerName,
      phnNumber,
      contractType,
      otherContractType,
      contractNumber,
      productName,
      mode,
      otherMode,
      renewalDate,
      lastRenewalDate,
      renewalTimes,
      years,
      months,
      doc,
      status,
      remarks
    } = req.body;

    const baseUrl = process.env.IMG_BASE_URL;
  

    // Construct public URL for contract attachment
    const contractAttachment = req.files["contractAttachment"]
      ? `${baseUrl}/images/${req.files["contractAttachment"][0].filename}`
      : null;

    // Validate required fields
    if (!custumerName || !contractNumber) {
      return res.status(400).json({
        success: false,
        message: "Customer Name and Contract Number are required",
      });
    }

    // Prepare update data
    const updateData = {
      custumerName,
      phnNumber,
      contractNumber,
      productName,
      renewalDate,
      lastRenewalDate,
      renewalTimes,
      years,
      months,
      doc,
      contractType: contractType === "other" ? otherContractType : contractType,
      mode: mode === "other" ? otherMode : mode,
      status,
      remarks
    };

    // Handle file uploads
    if (contractAttachment) {
      updateData.contractAttachment = contractAttachment;
    }

    // Update the record in the database
    const updatedRecord = await Excel.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Delete a record by ID
const deleteRecord = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const deletedRecord = await Excel.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!deletedRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const DateWiseRecord = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(currentDate);
    sevenDaysFromNow.setDate(currentDate.getDate() + 7);

    const records = await Excel.find({
      organization: req.user.organization,
      renewalDate: {
        $gte: currentDate,
        $lt: sevenDaysFromNow,
      },
    }).sort({ renewalDate: 1 });

    return res.status(200).json({
      data: records,
    });
  } catch (error) {
    console.error("Error fetching and filtering records:", error); // Log the error
    return res.status(500).json({
      // Use 500 for server errors
      message: "Failed to retrieve records.",
      error: error.message, // Include the error message for debugging
    });
  }
};

const bulkDeleteRenewals = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { ids } = req.body; // Array of IDs to delete


    // Check if IDs are provided and are in an array
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please provide an array of IDs.",
      });
    }

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    const deleteResult = await Excel.deleteMany({
      _id: { $in: objectIds },
      organization: req.user.organization,
    });

    // Check if any records were deleted
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No records found with the provided IDs.",
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} records deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Bulk upload records from a CSV file
const bulkUpload = async (req, res) => {
  try {
    if (!req.user?.organization) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (!req.files || !req.files.excel) {
      return res.status(400).json({
        success: false,
        message: "No Excel file uploaded.",
      });
    }

    const filePath = req.files.excel[0].path;
    console.log("File Path:", filePath);

    // Validate file type
    if (!filePath.endsWith(".xlsx") && !filePath.endsWith(".csv")) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only .xlsx or .csv files are allowed.",
      });
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validate required fields
    const requiredFields = [
      "contractType",
      "custumerName",
      "phnNumber",
      "contractNumber",
    ];
    const missingFields = requiredFields.filter(
      (field) => !data[0]?.hasOwnProperty(field)
    );

    if (missingFields.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Function to parse dates correctly
    function parseDate(value) {
      if (!value || value === "N/A") return null; // Handle missing values

      if (typeof value === "number") {
        // Convert Excel serial number to actual date
        return new Date((value - 25569) * 86400 * 1000);
      }

      // Parse MM/DD/YYYY format correctly
      const parsedDate = moment(value, ["MM/DD/YYYY"], true);
      return parsedDate.isValid() ? parsedDate.toDate() : null;
    }

    // Process Excel data
    const records = data.map((row) => ({
      organization: req.user.organization,
      creator: req.user.id,
      custumerName: row.custumerName || "N/A",
      phnNumber: row.phnNumber || "N/A",
      contractType: row.contractType || "N/A",
      contractNumber: row.contractNumber || "N/A",
      productName: row.productName || "N/A",
      doc: parseDate(row.doc), // Parse date
      years: row.years || "N/A",
      months: row.months || "N/A",
      mode: row.mode || "N/A",
      contractAttachment: row.contractAttachment || null,
      renewalDate: parseDate(row.renewalDate), // Parse date
      lastRenewalDate: parseDate(row.lastRenewalDate), // Parse date
      renewalTimes: row.renewalTimes || "N/A",
    }));

    console.log(records);
    // ✅ Function to Parse Dates Safely
    // function parseDate(dateString) {
    //   if (!dateString || dateString === "N/A") return null; // Handle missing or invalid values

    //   // Try parsing with different formats
    //   const parsedDate = moment(
    //     dateString,
    //     ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
    //     true
    //   );
    //   return parsedDate.isValid() ? parsedDate.toDate() : null; // Convert to Date object or null
    // }

    // Insert records into the database
    await Excel.insertMany(records);

    // Delete the uploaded file after processing

    res.status(201).json({
      success: true,
      message: "Bulk upload successful.",
      data: records,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during bulk upload.",
    });
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  DateWiseRecord,
  bulkUpload,
  bulkDeleteRenewals
};
