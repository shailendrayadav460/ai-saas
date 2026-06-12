const googleService = require('../services/google.service');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// ─── Check connection status ───────────────────────────────────────
const getStatus = async (req, res, next) => {
  try {
    const token = await prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId: req.user.id, provider: 'google' } },
      select: { scope: true, expiresAt: true, createdAt: true },
    });
    return successResponse(res, {
      connected: !!token,
      scope: token?.scope || null,
      connectedAt: token?.createdAt || null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Disconnect Google ─────────────────────────────────────────────
const disconnectGoogle = async (req, res, next) => {
  try {
    await prisma.oAuthToken.deleteMany({
      where: { userId: req.user.id, provider: 'google' },
    });
    return successResponse(res, null, 'Google account disconnected');
  } catch (err) {
    next(err);
  }
};

// ─── Gmail ────────────────────────────────────────────────────────
const sendEmail = async (req, res, next) => {
  try {
    const result = await googleService.sendEmail(req.user.id, req.body);
    return successResponse(res, result, 'Email sent successfully');
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

// ─── Calendar ─────────────────────────────────────────────────────
const listCalendarEvents = async (req, res, next) => {
  try {
    const events = await googleService.listCalendarEvents(req.user.id, req.query);
    return successResponse(res, events);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

const createCalendarEvent = async (req, res, next) => {
  try {
    const result = await googleService.createCalendarEvent(req.user.id, req.body);
    return successResponse(res, result, 'Calendar event created', 201);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

const createGoogleMeet = async (req, res, next) => {
  try {
    const result = await googleService.createGoogleMeet(req.user.id, req.body);
    return successResponse(res, result, 'Google Meet created', 201);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

// ─── Drive ────────────────────────────────────────────────────────
const listDriveFiles = async (req, res, next) => {
  try {
    const result = await googleService.listDriveFiles(req.user.id, req.query);
    return successResponse(res, result);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

const uploadToDrive = async (req, res, next) => {
  try {
    const result = await googleService.uploadToDrive(req.user.id, req.body);
    return successResponse(res, result, 'File uploaded to Drive', 201);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

// ─── Sheets ───────────────────────────────────────────────────────
const createSpreadsheet = async (req, res, next) => {
  try {
    const result = await googleService.createSpreadsheet(req.user.id, req.body);
    return successResponse(res, result, 'Spreadsheet created', 201);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

const appendToSpreadsheet = async (req, res, next) => {
  try {
    const result = await googleService.appendToSpreadsheet(req.user.id, req.body);
    return successResponse(res, result, 'Rows appended');
  } catch (err) {
    next(err);
  }
};

// ─── Docs ─────────────────────────────────────────────────────────
const createGoogleDoc = async (req, res, next) => {
  try {
    const result = await googleService.createGoogleDoc(req.user.id, req.body);
    return successResponse(res, result, 'Google Doc created', 201);
  } catch (err) {
    if (err.message.includes('not connected')) return errorResponse(res, err.message, 403);
    next(err);
  }
};

module.exports = {
  getStatus,
  disconnectGoogle,
  sendEmail,
  listCalendarEvents,
  createCalendarEvent,
  createGoogleMeet,
  listDriveFiles,
  uploadToDrive,
  createSpreadsheet,
  appendToSpreadsheet,
  createGoogleDoc,
};
