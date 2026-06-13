const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getPlans, createOrder, verifyPayment, confirmFree, getSubscription } = require('../controllers/payment.controller');

const router = express.Router();
router.use(authenticate);

router.get('/plans', getPlans);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/confirm-free', confirmFree);
router.get('/subscription', getSubscription);

module.exports = router;
