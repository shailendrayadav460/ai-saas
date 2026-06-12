const prisma = require('../config/database');

/**
 * Subscription Model — repository for user subscriptions
 */
const SubscriptionModel = {
  /**
   * Get subscription by userId
   */
  findByUser: (userId) =>
    prisma.subscription.findUnique({ where: { userId } }),

  /**
   * Create initial FREE subscription for a new user
   */
  createFree: (userId) =>
    prisma.subscription.create({
      data: { userId, plan: 'FREE', status: 'ACTIVE' },
    }),

  /**
   * Upsert subscription (used after payment)
   */
  upsert: (userId, data) =>
    prisma.subscription.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    }),

  /**
   * Activate Pro after Razorpay payment
   */
  activatePro: (userId, { orderId, paymentId }) =>
    prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: 'PRO',
        status: 'ACTIVE',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId,
        plan: 'PRO',
        status: 'ACTIVE',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),

  /**
   * Cancel subscription
   */
  cancel: (userId) =>
    prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELLED' },
    }),

  /**
   * Check if user is on PRO plan
   */
  isPro: async (userId) => {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });
    return sub?.plan === 'PRO' && sub?.status === 'ACTIVE';
  },
};

module.exports = SubscriptionModel;
