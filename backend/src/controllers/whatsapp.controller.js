const whatsappService = require('../services/whatsapp.service');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const sendMessage = async (req, res, next) => {
  try {
    const { to, message, mediaUrl } = req.body;
    
    if (req.user.plan !== 'PRO') {
      return errorResponse(res, 'This feature requires a PRO subscription', 403);
    }
    
    const result = await whatsappService.sendMessage(req.user.id, to, message, mediaUrl);
    return successResponse(res, result, 'WhatsApp message sent');
  } catch (err) {
    next(err);
  }
};
const getLogs = async (req, res, next) => {
  try {
    if (req.user.plan !== 'PRO') {
      return errorResponse(res, 'This feature requires a PRO subscription', 403);
    }
    const logs = await whatsappService.getLogs(req.user.id);
    return successResponse(res, logs);
  } catch (err) {
    next(err);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, contacts);
  } catch (err) {
    next(err);
  }
};

const addContact = async (req, res, next) => {
  try {
    const { name, email, phone, notes } = req.body;
    const contact = await prisma.contact.create({
      data: { userId: req.user.id, name, email, phone, notes },
    });
    return successResponse(res, contact, 'Contact added', 201);
  } catch (err) {
    next(err);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    await prisma.contact.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    return successResponse(res, null, 'Contact deleted');
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const { From, To, Body, MediaUrl0, ProfileName } = req.body;

    if (From && To) {
      await whatsappService.handleIncomingMessage(From, To, Body || '', MediaUrl0, ProfileName);
    }

    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (err) {
    console.error('Twilio Webhook Error:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = { sendMessage, getLogs, getContacts, addContact, deleteContact, handleWebhook };
