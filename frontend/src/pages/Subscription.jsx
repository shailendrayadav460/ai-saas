import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Star, CreditCard, Eye } from 'lucide-react';
import { paymentAPI } from '../api/payment.api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

const PLAN_FEATURES = {
  free: [
    '50 AI chat messages/month',
    '5 emails via Gmail/month',
    '3 calendar events/month',
    'Basic dashboard',
    'Community support',
  ],
  pro: [
    'Unlimited AI chat messages',
    'Unlimited Gmail emails',
    'Unlimited calendar events',
    'Google Drive file management',
    'Google Sheets & Docs',
    'Google Meet creation',
    'WhatsApp messaging',
    'Advanced analytics',
    'Priority support',
  ],
};

const Subscription = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirmingFree, setConfirmingFree] = useState(false);

  const handleConfirmFree = async () => {
    setConfirmingFree(true);
    try {
      await paymentAPI.confirmFree();
      toast.success('🎉 Free plan activated!');
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to confirm plan');
    } finally {
      setConfirmingFree(false);
    }
  };

  useEffect(() => {
    paymentAPI.getSubscription()
      .then(setSubscription)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setPaying(true);
    try {
      const order = await paymentAPI.createOrder('pro');

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'AI SaaS',
          description: 'Pro Plan — Monthly',
          order_id: order.orderId,
          handler: async (response) => {
            try {
              await paymentAPI.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: 'pro',
              });
              toast.success('🎉 Pro plan activated!');
              await refreshUser();
              const sub = await paymentAPI.getSubscription();
              setSubscription(sub);
              navigate('/dashboard');
            } catch {
              toast.error('Payment verification failed');
            }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#6366f1' },
        });
        rzp.open();
        setPaying(false);
      };
    } catch (err) {
      toast.error('Failed to initiate payment');
      setPaying(false);
    }
  };

  const isPro = user?.plan === 'PRO';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Current plan */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1">Current Plan</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{isPro ? 'Pro' : 'Free'} Plan</h2>
              <Badge variant={isPro ? 'pro' : 'info'}>
                {isPro ? <><Zap size={10} /> Active</> : 'Free'}
              </Badge>
            </div>
            {subscription?.currentPeriodEnd && isPro && (
              <p className="text-xs text-white/40 mt-1">
                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {isPro && <Star size={32} className="text-amber-400" />}
        </div>
      </div>

      {/* Plans comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-2xl p-6 flex flex-col gap-5 ${!isPro ? 'border-primary-500/30' : ''}`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-white">Free</h3>
              {!isPro && <Badge variant="info">Current</Badge>}
            </div>
            <p className="text-3xl font-bold text-white">₹0 <span className="text-sm font-normal text-white/40">/month</span></p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {PLAN_FEATURES.free.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                <Check size={14} className="text-primary-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {(!user?.hasConfirmedPlan && !isPro) ? (
            <Button
              className="w-full"
              onClick={handleConfirmFree}
              loading={confirmingFree}
            >
              Get Started with Free
            </Button>
          ) : (
            <Button variant="secondary" disabled={!isPro} onClick={handleConfirmFree} loading={confirmingFree}>
              {!isPro ? 'Current Plan' : 'Downgrade to Free'}
            </Button>
          )}
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative glass rounded-2xl p-6 flex flex-col gap-5 border-primary-500/40 bg-primary-600/5"
        >
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-primary-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-white">Pro</h3>
              {isPro && <Badge variant="pro"><Zap size={10} /> Active</Badge>}
            </div>
            <p className="text-3xl font-bold gradient-text">₹250 <span className="text-sm font-normal text-white/40">/month</span></p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {PLAN_FEATURES.pro.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                <div className="w-4 h-4 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-primary-400" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {!isPro ? (
            <Button
              className="w-full"
              onClick={handleUpgrade}
              loading={paying}
              leftIcon={<CreditCard size={16} />}
            >
              Upgrade to Pro — ₹250/month
            </Button>
          ) : (
            <Button variant="secondary" disabled className="w-full">
              <Shield size={16} />
              You're on Pro
            </Button>
          )}
        </motion.div>
      </div>

      {/* Security note */}
      <div className="glass rounded-xl p-4 flex items-center gap-3 text-xs text-white/40">
        <Shield size={16} className="text-primary-400 shrink-0" />
        <p>Payments are processed securely by Razorpay. We never store your card details.</p>
      </div>

      {/* Billing/Payment History */}
      {subscription && (subscription.razorpayPaymentId || subscription.razorpayOrderId) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">Payment & Billing History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="py-2.5 font-medium">Plan</th>
                  <th className="py-2.5 font-medium">Order ID</th>
                  <th className="py-2.5 font-medium">Payment ID</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 text-white/80">
                  <td className="py-3 font-semibold text-white">{subscription.plan}</td>
                  <td className="py-3 font-mono text-white/40">{subscription.razorpayOrderId || '—'}</td>
                  <td className="py-3 font-mono text-primary-400 font-medium">{subscription.razorpayPaymentId || '—'}</td>
                  <td className="py-3">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="py-3 font-semibold text-white">₹250.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Subscription;
