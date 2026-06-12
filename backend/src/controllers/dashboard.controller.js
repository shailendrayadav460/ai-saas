const prisma = require('../config/database');
const { successResponse } = require('../utils/helpers');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalConversations,
      totalMessages,
      todayStats,
      recentActions,
      subscription,
      googleConnected,
      last7Days,
    ] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.message.count({ where: { conversation: { userId } } }),
      prisma.usageStat.findUnique({ where: { userId_date: { userId, date: today } } }),
      prisma.aiActionLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.oAuthToken.findUnique({ where: { userId_provider: { userId, provider: 'google' } } }),
      prisma.usageStat.findMany({
        where: {
          userId,
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    return successResponse(res, {
      overview: {
        totalConversations,
        totalMessages,
        emailSentToday: todayStats?.emailSent || 0,
        meetingsToday: todayStats?.meetingsCreated || 0,
        driveActionsToday: todayStats?.driveActions || 0,
        whatsappSentToday: todayStats?.whatsappSent || 0,
        chatCountToday: todayStats?.chatCount || 0,
      },
      subscription: {
        plan: subscription?.plan || 'FREE',
        status: subscription?.status || 'ACTIVE',
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
      },
      googleConnected: !!googleConnected,
      recentActions,
      chartData: last7Days.map((s) => ({
        date: s.date,
        emails: s.emailSent,
        chats: s.chatCount,
        meetings: s.meetingsCreated,
        whatsapp: s.whatsappSent,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
