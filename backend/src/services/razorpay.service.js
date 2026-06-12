const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 */
const createOrder = async ({ amount, currency = 'INR', receipt }) => {
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency,
    receipt,
  });
  return order;
};

/**
 * Verify Razorpay payment signature
 */
const verifyPayment = ({ orderId, paymentId, signature }) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Get subscription details
 */
const getSubscription = async (subscriptionId) => {
  return await razorpay.subscriptions.fetch(subscriptionId);
};

module.exports = { createOrder, verifyPayment, getSubscription, razorpay };
