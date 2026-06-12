const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/database');

/**
 * Authenticate JWT from Authorization header or cookie
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        avatar: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Restrict to admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * Restrict features to PRO plan users
 */
const requirePro = (req, res, next) => {
  if (req.user?.plan === 'FREE') {
    return res.status(403).json({
      success: false,
      message: 'This feature requires a Pro subscription',
      upgradeRequired: true,
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requirePro };
