const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/User');
const SubscriptionInvoice = require('../models/SubscriptionInvoice');

const MONO_API_BASE = 'https://api.monobank.ua';

const getPlans = () => {
  const premiumPriceUah = Number(process.env.PREMIUM_PRICE_UAH || 99);
  const premiumAmount = Math.max(1, Math.round(premiumPriceUah * 100));

  return [
    {
      id: 'free',
      priceUah: 0,
      periodDays: 0
    },
    {
      id: 'premium_monthly',
      priceUah: premiumPriceUah,
      amount: premiumAmount,
      periodDays: 30
    }
  ];
};

const requireAdmin = (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return res.status(500).json({ message: 'Admin key not configured' });
  const provided = req.get('x-admin-key') || '';
  if (provided !== adminKey) return res.status(403).json({ message: 'Forbidden' });
  return next();
};

router.get('/plans', (req, res) => {
  res.json({ plans: getPlans() });
});

router.post('/downgrade', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isPremium = false;
    user.premiumExpiresAt = null;
    await user.save();

    res.json({ success: true, isPremium: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/cancel', auth, async (req, res) => {
  try {
    const { invoiceId } = req.body || {};
    if (!invoiceId) return res.status(400).json({ message: 'invoiceId is required' });

    const invoice = await SubscriptionInvoice.findOne({ invoiceId, user: req.user.userId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    await SubscriptionInvoice.deleteOne({ _id: invoice._id });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/checkout', auth, async (req, res) => {
  try {
    const { planId } = req.body || {};
    const plans = getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ message: 'Invalid planId' });
    if (plan.id === 'free') return res.status(400).json({ message: 'Free plan does not require checkout' });

    const token = process.env.MONO_MERCHANT_TEST_TOKEN || process.env.MONO_MERCHANT_TOKEN;
    if (!token) return res.status(500).json({ message: 'MONO token not configured' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const origin = req.get('origin') || process.env.WEB_APP_URL || '';
    const redirectUrl = origin ? `${origin.replace(/\/+$/, '')}/` : undefined;
    const webhookUrl = process.env.MONO_WEBHOOK_URL || undefined;

    const reference = `sub_${user._id}_${Date.now()}`;
    const destination = 'FitProgress Premium subscription';

    const invoicePayload = {
      amount: plan.amount,
      ccy: 980,
      redirectUrl,
      webHookUrl: webhookUrl,
      merchantPaymInfo: {
        reference,
        destination,
        basketOrder: [
          {
            name: 'FitProgress Premium (1 month)',
            qty: 1,
            sum: plan.amount,
            unit: 'pcs'
          }
        ]
      }
    };

    const monoResp = await fetch(`${MONO_API_BASE}/api/merchant/invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': token
      },
      body: JSON.stringify(invoicePayload)
    });

    const monoData = await monoResp.json().catch(() => ({}));
    if (!monoResp.ok) {
      return res.status(monoResp.status).json({ message: monoData?.message || 'Failed to create invoice' });
    }

    const invoice = await SubscriptionInvoice.create({
      user: user._id,
      planId: plan.id,
      amount: plan.amount,
      ccy: 980,
      invoiceId: monoData.invoiceId,
      pageUrl: monoData.pageUrl,
      status: 'created'
    });

    res.json({ invoiceId: invoice.invoiceId, pageUrl: invoice.pageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/latest', auth, async (req, res) => {
  try {
    const invoice = await SubscriptionInvoice.findOne({ user: req.user.userId }).sort({ createdAt: -1 });
    if (!invoice) return res.json({ invoice: null });
    res.json({
      invoice: {
        invoiceId: invoice.invoiceId,
        pageUrl: invoice.pageUrl,
        status: invoice.status,
        planId: invoice.planId,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const invoiceId = typeof req.query.invoiceId === 'string' ? req.query.invoiceId.trim() : '';
    if (!invoiceId) return res.status(400).json({ message: 'invoiceId is required' });

    const token = process.env.MONO_MERCHANT_TEST_TOKEN || process.env.MONO_MERCHANT_TOKEN;
    if (!token) return res.status(500).json({ message: 'MONO token not configured' });

    const invoice = await SubscriptionInvoice.findOne({ invoiceId, user: req.user.userId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const monoResp = await fetch(`${MONO_API_BASE}/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`, {
      method: 'GET',
      headers: {
        'X-Token': token
      }
    });

    const monoData = await monoResp.json().catch(() => ({}));
    if (!monoResp.ok) {
      return res.status(monoResp.status).json({ message: monoData?.message || 'Failed to fetch invoice status' });
    }

    const status = monoData?.status || 'unknown';
    invoice.status = status;
    invoice.updatedAt = new Date();
    await invoice.save();

    if (status === 'success') {
      const plans = getPlans();
      const plan = plans.find(p => p.id === invoice.planId);
      if (plan && plan.periodDays > 0) {
        const user = await User.findById(invoice.user);
        if (user) {
          const base = user.premiumExpiresAt && user.premiumExpiresAt > new Date() ? new Date(user.premiumExpiresAt) : new Date();
          base.setDate(base.getDate() + plan.periodDays);
          user.isPremium = true;
          user.premiumExpiresAt = base;
          await user.save();
        }
      }
    }

    res.json({
      invoiceId,
      status,
      pageUrl: invoice.pageUrl,
      raw: monoData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

const verifyWebhookSignature = (bodyBuffer, xSignBase64) => {
  const pubKeyBase64 = process.env.MONO_WEBHOOK_PUBKEY_BASE64;
  if (!pubKeyBase64) return true;
  if (!xSignBase64) return false;

  const signature = Buffer.from(String(xSignBase64), 'base64');
  const pem = Buffer.from(pubKeyBase64, 'base64').toString('utf8');

  const verify = crypto.createVerify('sha256');
  verify.update(bodyBuffer);
  verify.end();
  return verify.verify(pem, signature);
};

router.post('/monobank/webhook', async (req, res) => {
  const bodyBuffer = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
  const xSign = req.get('x-sign') || req.get('X-Sign') || '';

  try {
    const ok = verifyWebhookSignature(bodyBuffer, xSign);
    if (!ok) return res.status(403).json({ message: 'Invalid signature' });

    const invoiceId = req.body?.invoiceId;
    const status = req.body?.status;
    if (!invoiceId || !status) return res.status(400).json({ message: 'Invalid payload' });

    const invoice = await SubscriptionInvoice.findOne({ invoiceId });
    if (!invoice) return res.status(200).json({ ok: true });

    invoice.status = status;
    invoice.updatedAt = new Date();
    await invoice.save();

    if (status === 'success') {
      const plans = getPlans();
      const plan = plans.find(p => p.id === invoice.planId);
      if (plan && plan.periodDays > 0) {
        const user = await User.findById(invoice.user);
        if (user) {
          const base = user.premiumExpiresAt && user.premiumExpiresAt > new Date() ? new Date(user.premiumExpiresAt) : new Date();
          base.setDate(base.getDate() + plan.periodDays);
          user.isPremium = true;
          user.premiumExpiresAt = base;
          await user.save();
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/monopay/pubkey-import', requireAdmin, async (req, res) => {
  try {
    const token = process.env.MONO_MERCHANT_TEST_TOKEN || process.env.MONO_MERCHANT_TOKEN;
    if (!token) return res.status(500).json({ message: 'MONO token not configured' });

    const { keyValue, keyName, expiresAt } = req.body || {};
    if (!keyValue) return res.status(400).json({ message: 'keyValue is required' });

    const monoResp = await fetch(`${MONO_API_BASE}/api/merchant/monopay/pubkey-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': token
      },
      body: JSON.stringify({ keyValue, keyName, expiresAt })
    });

    const monoData = await monoResp.json().catch(() => ({}));
    if (!monoResp.ok) {
      return res.status(monoResp.status).json(monoData?.message ? { message: monoData.message } : monoData);
    }

    res.json(monoData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
