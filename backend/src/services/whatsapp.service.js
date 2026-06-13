const twilio = require('twilio');
const prisma = require('../config/database');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send a WhatsApp message via Twilio
 * @param {string} userId
 * @param {string} to - Phone number with country code (e.g. +919876543210)
 * @param {string} message - Text message
 */
const sendMessage = async (userId, to, message, mediaUrl = null) => {
  // Normalize the number
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const messageOptions = {
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: toNumber,
    body: message,
  };

  if (mediaUrl) {
    messageOptions.mediaUrl = [mediaUrl];
  }

  const result = await client.messages.create(messageOptions);

  // Log to DB
  await prisma.whatsappLog.create({
    data: { 
      userId, 
      to, 
      message, 
      mediaUrl,
      direction: 'OUTBOUND',
      status: result.status 
    },
  });

  return {
    sid: result.sid,
    status: result.status,
    to,
  };
};

/**
 * Handle incoming WhatsApp message via Twilio Webhook
 */
const handleIncomingMessage = async (from, to, body, mediaUrl, profileName) => {
  // In a real app, you would map 'from' to a userId based on contacts or phone numbers.
  // For this prototype, we'll try to find an admin or generic user to attach it to, 
  // or we can allow userId to be null. Wait, userId is required in WhatsappLog schema!
  // Let's find the admin user to attach these inbound logs, or just the first user.
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || 
                await prisma.user.findFirst();

  if (!admin) return;

  const normalizedFrom = from.replace('whatsapp:', '');

  await prisma.whatsappLog.create({
    data: {
      userId: admin.id,
      from: normalizedFrom,
      to,
      message: body,
      mediaUrl,
      direction: 'INBOUND',
      status: 'received',
    },
  });
};

/**
 * Get WhatsApp logs
 */
const getLogs = async (userId) => {
  return await prisma.whatsappLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
};

module.exports = { sendMessage, handleIncomingMessage, getLogs };
