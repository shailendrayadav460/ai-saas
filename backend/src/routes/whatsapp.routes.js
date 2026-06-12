const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { sendMessage, getLogs, getContacts, addContact, deleteContact } = require('../controllers/whatsapp.controller');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.post('/send', [
  body('to').notEmpty().withMessage('Phone number required'),
  body('message').notEmpty().withMessage('Message required'),
], validate, sendMessage);
router.get('/logs', getLogs);
router.get('/contacts', getContacts);
router.post('/contacts', [
  body('name').notEmpty().withMessage('Name required'),
], validate, addContact);
router.delete('/contacts/:id', deleteContact);

module.exports = router;
