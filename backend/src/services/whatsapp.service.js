const twilio = require('twilio');
const prisma = require('../config/database');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send a WhatsApp message via Twilio
 * @param {string} userId
 * @param {string} to - Phone number with country code (e.g. +919876543210)
 * @param {string} message - Text message
 */
const sendMessage = async (userId, to, message) => {
  // Normalize the number
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const result = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: toNumber,
    body: message,
  });

  // Log to DB
  await prisma.whatsappLog.create({
    data: { userId, to, message, status: result.status },
  });

  return {
    sid: result.sid,
    status: result.status,
    to,
  };
};

/**
 * Get WhatsApp logs for a user
 */
const getLogs = async (userId) => {
  return await prisma.whatsappLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

module.exports = { sendMessage, getLogs };
