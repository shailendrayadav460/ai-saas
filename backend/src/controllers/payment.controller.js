const razorpayService = require('../services/razorpay.service');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    features: ['50 AI messages/month', '5 emails/month', '3 calendar events/month', 'Basic dashboard'],
    limits: { messages: 50, emails: 5, events: 3 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    currency: 'INR',
    features: [
      'Unlimited AI messages',
      'Unlimited emails',
      'Unlimited calendar events',
      'Google Drive & Docs',
      'Google Sheets',
      'WhatsApp messaging',
      'Priority support',
      'Advanced analytics',
    ],
    limits: { messages: -1, emails: -1, events: -1 },
  },
];

// ─── Get Plans ────────────────────────────────────────────────────
const getPlans = async (req, res) => {
  return successResponse(res, PLANS);
};

// ─── Create Order ─────────────────────────────────────────────────
const createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || plan.price === 0) {
      return errorResponse(res, 'Invalid plan or free plan selected', 400);
    }

    const order = await razorpayService.createOrder({
      amount: plan.price,
      currency: 'INR',
      receipt: `sub_${req.user.id}_${Date.now()}`,
    });

    return successResponse(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Payment ───────────────────────────────────────────────
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, planId } = req.body;

    const isValid = razorpayService.verifyPayment({ orderId, paymentId, signature });
    if (!isValid) return errorResponse(res, 'Invalid payment signature', 400);

    // Update user plan and subscription
    await prisma.user.update({
      where: { id: req.user.id },
      data: { plan: 'PRO' },
    });

    await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: {
        plan: 'PRO',
        status: 'ACTIVE',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: req.user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return successResponse(res, { plan: 'PRO' }, 'Payment verified! Pro plan activated.');
  } catch (err) {
    next(err);
  }
};

// ─── Get Subscription ──────────────────────────────────────────────
const getSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });
    return successResponse(res, subscription);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlans, createOrder, verifyPayment, getSubscription };
