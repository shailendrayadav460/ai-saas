const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { encrypt } = require('../utils/crypto');
const { successResponse, errorResponse } = require('../utils/helpers');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Register ──────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, plan: true, avatar: true },
    });

    // Create free subscription record
    await prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
    });

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    res.cookie('access_token', accessToken, COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return successResponse(res, { user, accessToken }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Login ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, avatar: user.avatar };
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    res.cookie('access_token', accessToken, COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return successResponse(res, { user: safeUser, accessToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ─── Logout ────────────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return successResponse(res, null, 'Logged out successfully');
};

// ─── Get Current User ──────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        plan: true,
        isVerified: true,
        createdAt: true,
        oauthTokens: { select: { provider: true, scope: true, expiresAt: true } },
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      },
    });
    return successResponse(res, user);
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return errorResponse(res, 'Refresh token required', 401);

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) return errorResponse(res, 'User not found', 401);

    const newAccessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('access_token', newAccessToken, COOKIE_OPTIONS);

    return successResponse(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

// ─── Google OAuth Callback ─────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    const { user, accessToken: googleAccessToken, refreshToken: googleRefreshToken } = req.user;

    // Store encrypted Google tokens
    await prisma.oAuthToken.upsert({
      where: { userId_provider: { userId: user.id, provider: 'google' } },
      update: {
        accessToken: encrypt(googleAccessToken),
        refreshToken: googleRefreshToken ? encrypt(googleRefreshToken) : undefined,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
      create: {
        userId: user.id,
        provider: 'google',
        accessToken: encrypt(googleAccessToken),
        refreshToken: googleRefreshToken ? encrypt(googleRefreshToken) : null,
        scope: 'gmail calendar drive docs sheets',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    // Ensure subscription exists
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
    });

    const jwtToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const jwtRefresh = signRefreshToken({ id: user.id });

    res.cookie('access_token', jwtToken, COOKIE_OPTIONS);
    res.cookie('refresh_token', jwtRefresh, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    // Redirect to frontend dashboard
    res.redirect(`${process.env.CLIENT_URL}/dashboard?auth=success`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

module.exports = { register, login, logout, getMe, refreshToken, googleCallback };
