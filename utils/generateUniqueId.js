// utils/generateUniqueId.js
const peopleModel = require('../models/people');   // <-- adjust path if needed

/**
 * Generates the next IND-xxx id.
 * - Finds the highest number that already exists
 * - Increments it by 1
 * - Returns padded string: IND-001, IND-010, etc.
 */
const generateUniqueId = async () => {
  // Find the document with the highest numeric suffix
  const last = await peopleModel
    .findOne({ uniqueId: { $regex: /^IND-\d+$/ } })
    .sort({ uniqueId: -1 })
    .select('uniqueId')
    .lean();

  let nextNumber = 1;
  if (last && last.uniqueId) {
    const match = last.uniqueId.match(/^IND-(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  // Pad to at least 3 digits (001, 010, 100, …)
  return `IND-${String(nextNumber).padStart(3, '0')}`;
};

module.exports = generateUniqueId;