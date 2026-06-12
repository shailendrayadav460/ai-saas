const prisma = require('../config/database');
const openaiService = require('../services/openai.service');
const { successResponse, errorResponse, incrementUsage } = require('../utils/helpers');

// ─── Get all conversations ─────────────────────────────────────────
const getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return successResponse(res, conversations);
  } catch (err) {
    next(err);
  }
};

// ─── Create new conversation ───────────────────────────────────────
const createConversation = async (req, res, next) => {
  try {
    const { title = 'New Chat' } = req.body;
    const conversation = await prisma.conversation.create({
      data: { userId: req.user.id, title },
    });
    return successResponse(res, conversation, 'Conversation created', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Get messages of a conversation ───────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!conversation) return errorResponse(res, 'Conversation not found', 404);

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return successResponse(res, messages);
  } catch (err) {
    next(err);
  }
};

// ─── Send a message ────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!conversation) return errorResponse(res, 'Conversation not found', 404);

    // Save user message
    await prisma.message.create({
      data: { conversationId: id, role: 'user', content },
    });

    // Fetch full conversation history for context
    const history = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });

    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    // Call AI
    const { reply, toolsUsed } = await openaiService.chat(messages, req.user.id);

    // Save assistant reply
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: id,
        role: 'assistant',
        content: reply,
        metadata: toolsUsed.length > 0 ? { toolsUsed } : null,
      },
    });

    // Update conversation title if it's the first real message
    if (history.length <= 2 && conversation.title === 'New Chat') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await prisma.conversation.update({ where: { id }, data: { title } });
    }

    // Update conversation updatedAt
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    // Increment usage
    await incrementUsage(req.user.id, 'chatCount');

    return successResponse(res, {
      message: assistantMessage,
      toolsUsed,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete a conversation ─────────────────────────────────────────
const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.conversation.deleteMany({ where: { id, userId: req.user.id } });
    return successResponse(res, null, 'Conversation deleted');
  } catch (err) {
    next(err);
  }
};

// ─── Update conversation title ─────────────────────────────────────
const updateConversationTitle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const conv = await prisma.conversation.updateMany({
      where: { id, userId: req.user.id },
      data: { title },
    });
    return successResponse(res, conv, 'Title updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteConversation,
  updateConversationTitle,
};
