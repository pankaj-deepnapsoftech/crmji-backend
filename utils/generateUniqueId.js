// utils/generateUniqueId.js
const peopleModel = require('../models/people');   // <-- adjust path if needed

/**
 * Generates the next IND-xxx id per creator/admin.
 * - Finds the highest number that already exists for the specific creator
 * - Increments it by 1
 * - Returns padded string: IND-001, IND-002, etc.
 * - Each creator/admin starts from IND-001 independently
 */
const generateUniqueId = async (creatorId) => {
  if (!creatorId) {
    throw new Error('creatorId is required to generate uniqueId');
  }

  // Find the document with the highest numeric suffix for this specific creator
  const last = await peopleModel
    .findOne({
      creator: creatorId,
      uniqueId: { $regex: /^IND-\d{3}$/ }
    })
    .sort({ uniqueId: -1 })
    .select('uniqueId')
    .lean();

  let nextNumber = 1;
  if (last && last.uniqueId) {
    const match = last.uniqueId.match(/^IND-(\d{3})$/);
    if (match) {
      const currentNum = parseInt(match[1], 10);
      if (!Number.isNaN(currentNum)) {
        nextNumber = currentNum + 1;
      }
    }
  }

  // Pad to 3 digits (001, 002, 010, 100, …)
  return `IND-${String(nextNumber).padStart(3, '0')}`;
};

module.exports = generateUniqueId;  