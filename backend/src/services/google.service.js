const { google } = require('googleapis');
const prisma = require('../config/database');
const { decrypt, encrypt } = require('../utils/crypto');

/**
 * Build an authenticated Google OAuth2 client for a specific user
 * Automatically refreshes expired access tokens
 */
const getGoogleClient = async (userId) => {
  const tokenRecord = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: 'google' } },
  });

  if (!tokenRecord) {
    throw new Error('Google account not connected. Please connect your Google account first.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  const accessToken = decrypt(tokenRecord.accessToken);
  const refreshToken = tokenRecord.refreshToken ? decrypt(tokenRecord.refreshToken) : null;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Auto-refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.oAuthToken.update({
        where: { userId_provider: { userId, provider: 'google' } },
        data: {
          accessToken: encrypt(tokens.access_token),
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    }
  });

  return oauth2Client;
};

// ─── Gmail ────────────────────────────────────────────────────────────

/**
 * Send an email from the user's Gmail
 */
const sendEmail = async (userId, { to, subject, body, cc }) => {
  const auth = await getGoogleClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const emailLines = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].filter(Boolean);

  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedEmail },
  });

  return { messageId: result.data.id, to, subject };
};

// ─── Google Calendar ──────────────────────────────────────────────────

/**
 * Create a calendar event
 */
const createCalendarEvent = async (userId, { title, startDateTime, endDateTime, description, attendees, location }) => {
  const auth = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: title,
    description,
    location,
    start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
    attendees: attendees?.map((email) => ({ email })) || [],
  };

  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    sendUpdates: 'all',
  });

  return {
    eventId: result.data.id,
    htmlLink: result.data.htmlLink,
    title,
    start: startDateTime,
    end: endDateTime,
  };
};

/**
 * Create a Google Meet with a calendar event
 */
const createGoogleMeet = async (userId, { title, startDateTime, endDateTime, attendees }) => {
  const auth = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: title,
    start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
    attendees: attendees?.map((email) => ({ email })) || [],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  const meetLink = result.data.conferenceData?.entryPoints?.[0]?.uri || null;

  return {
    eventId: result.data.id,
    htmlLink: result.data.htmlLink,
    meetLink,
    title,
    start: startDateTime,
  };
};

/**
 * List calendar events
 */
const listCalendarEvents = async (userId, { maxResults = 10, timeMin } = {}) => {
  const auth = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const result = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin || new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return result.data.items || [];
};

// ─── Google Drive ─────────────────────────────────────────────────────

/**
 * List Drive files
 */
const listDriveFiles = async (userId, { query, maxResults = 10 } = {}) => {
  const auth = await getGoogleClient(userId);
  const drive = google.drive({ version: 'v3', auth });

  const result = await drive.files.list({
    q: query || undefined,
    pageSize: maxResults,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
  });

  return { files: result.data.files || [] };
};

/**
 * Upload a text file to Drive
 */
const uploadToDrive = async (userId, { name, content, mimeType = 'text/plain' }) => {
  const auth = await getGoogleClient(userId);
  const drive = google.drive({ version: 'v3', auth });

  const { Readable } = require('stream');
  const stream = Readable.from([content]);

  const result = await drive.files.create({
    requestBody: { name, mimeType },
    media: { mimeType, body: stream },
    fields: 'id, name, webViewLink',
  });

  return {
    fileId: result.data.id,
    name: result.data.name,
    webViewLink: result.data.webViewLink,
  };
};

// ─── Google Sheets ────────────────────────────────────────────────────

/**
 * Create a new Google Spreadsheet
 */
const createSpreadsheet = async (userId, { title, headers = [], rows = [] }) => {
  const auth = await getGoogleClient(userId);
  const sheets = google.sheets({ version: 'v4', auth });

  // Create spreadsheet
  const result = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  });

  const spreadsheetId = result.data.spreadsheetId;

  // Add data if provided
  const allRows = [];
  if (headers.length > 0) allRows.push(headers);
  if (rows.length > 0) allRows.push(...rows);

  if (allRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: allRows },
    });
  }

  return {
    spreadsheetId,
    title,
    url: result.data.spreadsheetUrl,
  };
};

/**
 * Append rows to existing spreadsheet
 */
const appendToSpreadsheet = async (userId, { spreadsheetId, rows }) => {
  const auth = await getGoogleClient(userId);
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });

  return { spreadsheetId, rowsAppended: rows.length };
};

// ─── Google Docs ──────────────────────────────────────────────────────

/**
 * Create a new Google Doc
 */
const createGoogleDoc = async (userId, { title, content }) => {
  const auth = await getGoogleClient(userId);
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  // Create doc
  const result = await docs.documents.create({
    requestBody: { title },
  });

  const documentId = result.data.documentId;

  // Insert content
  if (content) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    });
  }

  // Get the web link
  const fileInfo = await drive.files.get({
    fileId: documentId,
    fields: 'webViewLink',
  });

  return {
    documentId,
    title,
    url: fileInfo.data.webViewLink,
  };
};

/**
 * Check if user has connected Google account
 */
const isGoogleConnected = async (userId) => {
  const token = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: 'google' } },
  });
  return !!token;
};

module.exports = {
  sendEmail,
  createCalendarEvent,
  createGoogleMeet,
  listCalendarEvents,
  listDriveFiles,
  uploadToDrive,
  createSpreadsheet,
  appendToSpreadsheet,
  createGoogleDoc,
  isGoogleConnected,
  getGoogleClient,
};
