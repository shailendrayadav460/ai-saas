const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getPlans, createOrder, verifyPayment, getSubscription } = require('../controllers/payment.controller');

const router = express.Router();
router.use(authenticate);

router.get('/plans', getPlans);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/subscription', getSubscription);

module.exports = router;
