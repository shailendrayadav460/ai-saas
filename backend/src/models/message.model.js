const prisma = require('../config/database');

/**
 * Message Model — repository for chat messages
 */
const MessageModel = {
  /**
   * Get all messages for a conversation (oldest first)
   */
  findByConversation: (conversationId) =>
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    }),

  /**
   * Get messages as OpenAI-compatible format { role, content }
   */
  findAsHistory: async (conversationId) => {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
    return messages.map((m) => ({ role: m.role, content: m.content }));
  },

  /**
   * Create a single message
   */
  create: (data) =>
    prisma.message.create({ data }),

  /**
   * Bulk create messages
   */
  createMany: (messages) =>
    prisma.message.createMany({ data: messages }),

  /**
   * Count messages for a user (through conversations)
   */
  countByUser: (userId) =>
    prisma.message.count({
      where: { conversation: { userId } },
    }),

  /**
   * Delete all messages in a conversation
   */
  deleteByConversation: (conversationId) =>
    prisma.message.deleteMany({ where: { conversationId } }),
};

module.exports = MessageModel;
