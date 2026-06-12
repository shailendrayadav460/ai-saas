/**
 * AI Tool Definitions for OpenAI Function Calling
 * Each tool has: name, description, parameters (JSON Schema)
 */
const tools = [
  // ─── Gmail ──────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email via the user\'s Gmail account',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body (plain text or HTML)' },
          cc: { type: 'string', description: 'CC email address (optional)' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },

  // ─── Google Calendar ─────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create an event on the user\'s Google Calendar',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          startDateTime: { type: 'string', description: 'ISO 8601 start date-time, e.g. 2024-06-15T14:00:00' },
          endDateTime: { type: 'string', description: 'ISO 8601 end date-time, e.g. 2024-06-15T15:00:00' },
          description: { type: 'string', description: 'Event description (optional)' },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of attendee email addresses',
          },
          location: { type: 'string', description: 'Event location (optional)' },
        },
        required: ['title', 'startDateTime', 'endDateTime'],
      },
    },
  },

  // ─── Google Meet ─────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_google_meet',
      description: 'Create a Google Meet video conference and add it to Google Calendar',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Meeting title' },
          startDateTime: { type: 'string', description: 'ISO 8601 start date-time' },
          endDateTime: { type: 'string', description: 'ISO 8601 end date-time' },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'Attendee emails',
          },
        },
        required: ['title', 'startDateTime', 'endDateTime'],
      },
    },
  },

  // ─── Google Drive ─────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'list_drive_files',
      description: 'List files in the user\'s Google Drive',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query to filter files (optional)' },
          maxResults: { type: 'number', description: 'Maximum number of results (default 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upload_to_drive',
      description: 'Create a text file and upload it to Google Drive',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'File name' },
          content: { type: 'string', description: 'Text content of the file' },
          mimeType: { type: 'string', description: 'MIME type, default is text/plain' },
        },
        required: ['name', 'content'],
      },
    },
  },

  // ─── Google Sheets ────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_spreadsheet',
      description: 'Create a new Google Spreadsheet with optional initial data',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Spreadsheet title' },
          headers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Column headers for the first row',
          },
          rows: {
            type: 'array',
            items: { type: 'array', items: { type: 'string' } },
            description: 'Data rows (array of arrays)',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_to_spreadsheet',
      description: 'Append rows of data to an existing Google Spreadsheet',
      parameters: {
        type: 'object',
        properties: {
          spreadsheetId: { type: 'string', description: 'Google Spreadsheet ID' },
          rows: {
            type: 'array',
            items: { type: 'array', items: { type: 'string' } },
            description: 'Rows to append',
          },
        },
        required: ['spreadsheetId', 'rows'],
      },
    },
  },

  // ─── Google Docs ─────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_google_doc',
      description: 'Create a new Google Doc with content',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Document title' },
          content: { type: 'string', description: 'Document content in plain text' },
        },
        required: ['title', 'content'],
      },
    },
  },

  // ─── WhatsApp ─────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'send_whatsapp_message',
      description: 'Send a WhatsApp message to a phone number',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient phone number with country code, e.g. +919876543210' },
          message: { type: 'string', description: 'Message text to send' },
        },
        required: ['to', 'message'],
      },
    },
  },
];

module.exports = tools;
