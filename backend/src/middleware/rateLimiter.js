const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development';

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max: isDev ? 100000 : max, // Raise limit to 100k in development
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// General API limiter
const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests, please try again later.'
);

// Auth routes limiter (stricter)
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again later.'
);

// AI chat limiter
const chatLimiter = createLimiter(
  60 * 1000, // 1 minute
  20,
  'Too many messages, please slow down.'
);

module.exports = { apiLimiter, authLimiter, chatLimiter };
