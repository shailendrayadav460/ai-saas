const prisma = require('../config/database');

/**
 * Increment a daily usage stat for a user
 * @param {string} userId
 * @param {string} field - field name to increment (e.g. 'emailSent')
 */
const incrementUsage = async (userId, field) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.usageStat.upsert({
      where: { userId_date: { userId, date: today } },
      update: { [field]: { increment: 1 } },
      create: { userId, date: today, [field]: 1 },
    });
  } catch (err) {
    console.error('incrementUsage error:', err);
  }
};

/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * Standard error response
 */
const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

/**
 * Parse a date string to a JS Date, returning null on failure
 */
const parseDate = (str) => {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

module.exports = { incrementUsage, successResponse, errorResponse, parseDate };
