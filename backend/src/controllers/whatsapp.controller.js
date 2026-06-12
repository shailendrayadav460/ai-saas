const whatsappService = require('../services/whatsapp.service');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const sendMessage = async (req, res, next) => {
  try {
    const { to, message } = req.body;
    const result = await whatsappService.sendMessage(req.user.id, to, message);
    return successResponse(res, result, 'WhatsApp message sent');
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
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

module.exports = { sendMessage, getLogs, getContacts, addContact, deleteContact };
