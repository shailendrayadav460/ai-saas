const prisma = require('../config/database');

/**
 * Conversation Model — repository for chat conversations
 */
const ConversationModel = {
  /**
   * Get all conversations for a user (newest first)
   */
  findAllByUser: (userId) =>
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, createdAt: true, updatedAt: true,
        _count: { select: { messages: true } },
      },
    }),

  /**
   * Find one conversation (verify ownership)
   */
  findByIdAndUser: (id, userId) =>
    prisma.conversation.findFirst({
      where: { id, userId },
    }),

  /**
   * Create a new conversation
   */
  create: (userId, title = 'New Chat') =>
    prisma.conversation.create({
      data: { userId, title },
    }),

  /**
   * Update conversation title
   */
  updateTitle: (id, title) =>
    prisma.conversation.update({
      where: { id },
      data: { title, updatedAt: new Date() },
    }),

  /**
   * Touch updatedAt (after new message)
   */
  touch: (id) =>
    prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),

  /**
   * Delete a conversation (cascades messages)
   */
  delete: (id, userId) =>
    prisma.conversation.deleteMany({ where: { id, userId } }),

  /**
   * Count conversations for a user
   */
  countByUser: (userId) =>
    prisma.conversation.count({ where: { userId } }),
};

module.exports = ConversationModel;
