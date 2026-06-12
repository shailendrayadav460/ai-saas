const express = require('express');
const { body } = require('express-validator');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteConversation,
  updateConversationTitle,
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { chatLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/conversations', [body('title').optional().trim()], validate, createConversation);
router.get('/conversations/:id/messages', getMessages);
router.post(
  '/conversations/:id/messages',
  chatLimiter,
  [body('content').notEmpty().withMessage('Message content required')],
  validate,
  sendMessage
);
router.delete('/conversations/:id', deleteConversation);
router.patch(
  '/conversations/:id',
  [body('title').notEmpty().withMessage('Title required')],
  validate,
  updateConversationTitle
);

module.exports = router;
