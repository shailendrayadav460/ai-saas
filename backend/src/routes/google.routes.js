const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getStatus, disconnectGoogle,
  sendEmail,
  listCalendarEvents, createCalendarEvent, createGoogleMeet,
  listDriveFiles, uploadToDrive,
  createSpreadsheet, appendToSpreadsheet,
  createGoogleDoc,
} = require('../controllers/google.controller');

const router = express.Router();
router.use(authenticate);

// Status
router.get('/status', getStatus);
router.delete('/disconnect', disconnectGoogle);

// Gmail
router.post('/gmail/send', sendEmail);

// Calendar
router.get('/calendar/events', listCalendarEvents);
router.post('/calendar/events', createCalendarEvent);
router.post('/calendar/meet', createGoogleMeet);

// Drive
router.get('/drive/files', listDriveFiles);
router.post('/drive/upload', uploadToDrive);

// Sheets
router.post('/sheets/create', createSpreadsheet);
router.post('/sheets/:id/append', appendToSpreadsheet);

// Docs
router.post('/docs/create', createGoogleDoc);

module.exports = router;
