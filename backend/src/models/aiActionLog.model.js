const prisma = require('../config/database');

/**
 * AiActionLog Model — tracks all AI tool executions
 */
const AiActionLogModel = {
  create: (userId, actionType, payload) =>
    prisma.aiActionLog.create({
      data: { userId, actionType, payload, status: 'PENDING' },
    }),

  updateSuccess: (id, result) =>
    prisma.aiActionLog.update({
      where: { id },
      data: { status: 'SUCCESS', result },
    }),

  updateFailed: (id, error) =>
    prisma.aiActionLog.update({
      where: { id },
      data: { status: 'FAILED', error },
    }),

  findRecentByUser: (userId, take = 10) =>
    prisma.aiActionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    }),

  countByUser: (userId) =>
    prisma.aiActionLog.count({ where: { userId } }),
};

module.exports = AiActionLogModel;
