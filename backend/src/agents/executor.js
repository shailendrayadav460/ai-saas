const googleService = require('../services/google.service');
const whatsappService = require('../services/whatsapp.service');
const prisma = require('../config/database');
const { incrementUsage } = require('../utils/helpers');

/**
 * Execute a tool call from the AI agent
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Parsed arguments from OpenAI function call
 * @param {string} userId - Authenticated user ID
 * @returns {object} - Result to send back to OpenAI
 */
const executeToolCall = async (toolName, args, userId) => {
  console.log(`🔧 Executing tool: ${toolName}`, args);

  // Log action start
  const actionLog = await prisma.aiActionLog.create({
    data: { userId, actionType: toolName, payload: args, status: 'PENDING' },
  });

  try {
    let result;

    switch (toolName) {
      // ─── Gmail ───────────────────────────────────────────────
      case 'send_email': {
        result = await googleService.sendEmail(userId, args);
        await incrementUsage(userId, 'emailSent');
        break;
      }

      // ─── Google Calendar ──────────────────────────────────────
      case 'create_calendar_event': {
        result = await googleService.createCalendarEvent(userId, args);
        await incrementUsage(userId, 'meetingsCreated');
        break;
      }

      // ─── Google Meet ──────────────────────────────────────────
      case 'create_google_meet': {
        result = await googleService.createGoogleMeet(userId, args);
        await incrementUsage(userId, 'meetingsCreated');
        break;
      }

      // ─── Google Drive ─────────────────────────────────────────
      case 'list_drive_files': {
        result = await googleService.listDriveFiles(userId, args);
        await incrementUsage(userId, 'driveActions');
        break;
      }

      case 'upload_to_drive': {
        result = await googleService.uploadToDrive(userId, args);
        await incrementUsage(userId, 'driveActions');
        break;
      }

      // ─── Google Sheets ────────────────────────────────────────
      case 'create_spreadsheet': {
        result = await googleService.createSpreadsheet(userId, args);
        await incrementUsage(userId, 'sheetsActions');
        break;
      }

      case 'append_to_spreadsheet': {
        result = await googleService.appendToSpreadsheet(userId, args);
        await incrementUsage(userId, 'sheetsActions');
        break;
      }

      // ─── Google Docs ──────────────────────────────────────────
      case 'create_google_doc': {
        result = await googleService.createGoogleDoc(userId, args);
        await incrementUsage(userId, 'docsActions');
        break;
      }

      // ─── WhatsApp ─────────────────────────────────────────────
      case 'send_whatsapp_message': {
        result = await whatsappService.sendMessage(userId, args.to, args.message);
        await incrementUsage(userId, 'whatsappSent');
        break;
      }

      default:
        result = { error: `Unknown tool: ${toolName}` };
    }

    // Update action log as success
    await prisma.aiActionLog.update({
      where: { id: actionLog.id },
      data: { status: 'SUCCESS', result },
    });

    return { success: true, ...result };
  } catch (error) {
    console.error(`Tool execution error [${toolName}]:`, error);

    // Update action log as failed
    await prisma.aiActionLog.update({
      where: { id: actionLog.id },
      data: { status: 'FAILED', error: error.message },
    });

    return { success: false, error: error.message };
  }
};

module.exports = { executeToolCall };
