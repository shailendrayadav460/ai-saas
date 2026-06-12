import api from './axios';

export const paymentAPI = {
  getPlans: () => api.get('/payments/plans'),
  createOrder: (planId) => api.post('/payments/create-order', { planId }),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getSubscription: () => api.get('/payments/subscription'),
};
